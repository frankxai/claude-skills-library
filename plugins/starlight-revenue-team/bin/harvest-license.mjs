#!/usr/bin/env node
// Decides whether text from another repo may be adapted, from its SPDX licence id.
// GitHub reports NOASSERTION when it cannot identify a licence; that is treated as
// unknown, which means no copying.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', '0BSD', 'Unlicense']);
const COPYLEFT = /^(AGPL|GPL|LGPL|MPL|EPL|EUPL|CC-BY-SA|OSL)/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

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

function lookupSpdx(repo) {
  try {
    const out = execFileSync('gh', ['api', `repos/${repo}/license`, '--jq', '.license.spdx_id'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function main(argv) {
  const repo = argv[2];
  if (!isRepoSlug(repo)) {
    console.error('usage: harvest-license.mjs <owner/repo>');
    return 1;
  }
  const spdx = lookupSpdx(repo);
  console.log(JSON.stringify({ repo, spdx, ...classify(spdx) }, null, 2));
  return classify(spdx).copy ? 0 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv);
}
