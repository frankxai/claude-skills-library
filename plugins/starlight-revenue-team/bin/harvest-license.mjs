#!/usr/bin/env node
// Decides whether text from another repo may be adapted. The verdict is bound to
// one commit and, when a path is given, checks that path for its own licence
// files, because a permissive root licence does not cover vendored code that
// carries different terms. GitHub reports NOASSERTION when it cannot identify a
// licence; that is treated as unknown, which means no copying.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', '0BSD', 'Unlicense']);
const COPYLEFT = /^(AGPL|GPL|LGPL|MPL|EPL|EUPL|CC-BY-SA|OSL)/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const PATH = /^[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)*\/?$/;
const LICENCE_FILE = /^(LICEN[CS]E|COPYING|NOTICE|UNLICENSE)(\.|$)/i;

export function classify(spdx) {
  if (spdx && PERMISSIVE.has(spdx)) {
    return { class: 'permissive', copy: true, action: 'adapt with a THIRD_PARTY_NOTICES.md row naming repo, commit, licence and files' };
  }
  if (spdx && COPYLEFT.test(spdx)) {
    return { class: 'copyleft', copy: false, action: 'copy no text; copying would bind this repo to the copyleft terms; write from principles and credit' };
  }
  return { class: 'none-unknown', copy: false, action: 'copy no text; write from principles and credit the source' };
}

export function isRepoSlug(value) {
  return typeof value === 'string' && REPO.test(value);
}

export function isSafePath(value) {
  return typeof value === 'string' && PATH.test(value) && !value.split('/').some((seg) => seg === '..' || seg === '.');
}

// gh: (args) => trimmed stdout, or null on any failure. Injected so tests run offline.
export function harvest(repo, path, gh) {
  const sha = gh(['api', `repos/${repo}/commits/HEAD`, '--jq', '.sha']);
  if (!sha) {
    return { repo, path: path || null, sha: null, spdx: null, ...classify(null), action: 'could not resolve the source commit; copy nothing' };
  }
  const spdx = gh(['api', `repos/${repo}/license?ref=${sha}`, '--jq', '.license.spdx_id']);
  const base = { repo, path: path || null, sha, spdx, ...classify(spdx) };
  if (!path) return base;

  const listing = gh(['api', `repos/${repo}/contents/${path.replace(/\/$/, '')}?ref=${sha}`, '--jq', '.[]?.name']);
  if (listing === null) {
    return { ...base, copy: false, class: 'needs-review', action: 'could not list the selected path at this commit; copy nothing until it is checked' };
  }
  const ownLicences = listing.split('\n').map((s) => s.trim()).filter((name) => LICENCE_FILE.test(name));
  if (ownLicences.length) {
    return { ...base, copy: false, class: 'needs-review', pathLicenceFiles: ownLicences, action: 'the selected path carries its own licence files; read them before adapting anything' };
  }
  return base;
}

function ghRunner(args) {
  try {
    const out = execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function main(argv) {
  const [repo, path] = [argv[2], argv[3]];
  if (!isRepoSlug(repo) || (path !== undefined && !isSafePath(path))) {
    console.error('usage: harvest-license.mjs <owner/repo> [path inside the repo]');
    return 1;
  }
  const result = harvest(repo, path, ghRunner);
  console.log(JSON.stringify(result, null, 2));
  return result.copy ? 0 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv);
}
