import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

function arg(name) {
  const hit = process.argv.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : '';
}

function git(repo, args) {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'git failed').trim());
  }
  return result.stdout;
}

function tool(repo, command, args) {
  const file = process.platform === 'win32' && command === 'pnpm' ? 'pnpm.cmd' : command;
  const result = spawnSync(file, args, {
    cwd: repo,
    encoding: 'utf8',
    env: process.env,
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  return result;
}

function has(repo, name) {
  return existsSync(join(repo, name));
}

function readJson(repo, name) {
  if (!has(repo, name)) return null;
  return JSON.parse(readFileSync(join(repo, name), 'utf8'));
}

function field(label, value) {
  return `${label.padEnd(10)}${value}`;
}

function notRun(reason) {
  return { status: 'NOT RUN', detail: reason };
}

function fromTool(result, command, args) {
  const shown = [command, ...args].join(' ');
  if (result.error && result.error.code === 'ENOENT') {
    return notRun(`${shown} is not on PATH`);
  }
  if (result.status === 0) return { status: 'PASS', detail: shown };
  const tail = `${result.stdout || ''}${result.stderr || ''}`.trim().split(/\r?\n/).at(-1) || 'non-zero exit';
  return { status: 'FAIL', detail: `${shown}: ${tail}` };
}

function classifyBuild(repo) {
  const scripts = readJson(repo, 'package.json')?.scripts ?? {};
  if (has(repo, 'pnpm-lock.yaml')) {
    if (!scripts.build) return notRun('no build script');
    return fromTool(tool(repo, 'pnpm', ['run', 'build']), 'pnpm', ['run', 'build']);
  }
  if (has(repo, 'uv.lock') || has(repo, 'pyproject.toml')) {
    return notRun('no Python build step is configured');
  }
  return notRun('no pnpm-lock.yaml or uv.lock');
}

function classifyTypes(repo) {
  if (has(repo, 'tsconfig.json')) {
    if (!has(repo, 'pnpm-lock.yaml')) return notRun('tsconfig.json is present and pnpm-lock.yaml is not');
    return fromTool(tool(repo, 'pnpm', ['exec', 'tsc', '--noEmit']), 'pnpm', ['exec', 'tsc', '--noEmit']);
  }
  if (has(repo, 'pyproject.toml') && readFileSync(join(repo, 'pyproject.toml'), 'utf8').includes('pyright')) {
    return fromTool(tool(repo, 'uv', ['run', 'pyright']), 'uv', ['run', 'pyright']);
  }
  return notRun('no typecheck config');
}

function classifyLint(repo) {
  const configured = ['eslint.config.js', 'eslint.config.mjs', 'biome.json', 'ruff.toml'].some((name) => has(repo, name));
  if (!configured) return notRun('no linter config');
  if (!has(repo, 'pnpm-lock.yaml')) return notRun('linter config is present and pnpm-lock.yaml is not');
  const scripts = readJson(repo, 'package.json')?.scripts ?? {};
  if (scripts.lint) return fromTool(tool(repo, 'pnpm', ['run', 'lint']), 'pnpm', ['run', 'lint']);
  return notRun('linter config is present and package.json has no lint script');
}

function classifyTests(repo) {
  const scripts = readJson(repo, 'package.json')?.scripts ?? {};
  if (has(repo, 'pnpm-lock.yaml')) {
    if (!scripts.test) return notRun('no test script');
    return fromTool(tool(repo, 'pnpm', ['test']), 'pnpm', ['test']);
  }
  if (has(repo, 'pyproject.toml') && readFileSync(join(repo, 'pyproject.toml'), 'utf8').includes('[tool.pytest')) {
    return fromTool(tool(repo, 'uv', ['run', 'pytest']), 'uv', ['run', 'pytest']);
  }
  return notRun('no pnpm-lock.yaml or pytest config');
}

function secretHit(patch) {
  const lines = patch.split(/\r?\n/);
  for (const line of lines) {
    if (/reject|deny|do not commit|scan for|token prefix/i.test(line) && !/sk-ant-[A-Za-z0-9_-]{8,}/.test(line)) {
      continue;
    }
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) return 'private key block';
    if (/sk-ant-[A-Za-z0-9_-]{8,}/.test(line)) return 'sk-ant token';
    if (/\bghp_[A-Za-z0-9]{20,}/.test(line) || /github_pat_[A-Za-z0-9_]{20,}/.test(line)) return 'GitHub token';
    if (/\bxox[baprs]-[A-Za-z0-9-]{8,}/.test(line)) return 'Slack token';
  }
  return '';
}

function show(value) {
  if (!value.detail || value.status === 'PASS') return value.status;
  return `${value.status} (${value.detail})`;
}

const repo = arg('repo');
if (!repo) {
  console.error('usage: node absorbed/harness/verification-run.mjs --repo=<path> [--root]');
  process.exit(2);
}

const useRoot = process.argv.includes('--root');
if (useRoot) {
  const seeded = spawnSync('git', ['hash-object', '-t', 'tree', '-w', '--stdin'], {
    cwd: repo,
    input: '',
    encoding: 'utf8',
  });
  if (seeded.status !== 0) throw new Error((seeded.stderr || 'empty tree write failed').trim());
}
const patch = useRoot
  ? git(repo, ['diff', EMPTY_TREE, 'HEAD'])
  : git(repo, ['diff', 'HEAD']);
const names = (useRoot
  ? git(repo, ['diff', '--name-only', EMPTY_TREE, 'HEAD'])
  : git(repo, ['diff', '--name-only', 'HEAD']))
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter(Boolean);
const untracked = git(repo, ['ls-files', '--others', '--exclude-standard'])
  .split(/\r?\n/)
  .map((item) => item.trim())
  .filter(Boolean);
const untrackedText = untracked.map((name) => {
  try {
    return readFileSync(join(repo, name), 'utf8');
  } catch {
    return '';
  }
}).join('\n');

const checks = {
  build: classifyBuild(repo),
  types: classifyTypes(repo),
  lint: classifyLint(repo),
  tests: classifyTests(repo),
  secrets: secretHit(`${patch}\n${untrackedText}`)
    ? { status: 'FAIL', detail: secretHit(`${patch}\n${untrackedText}`) }
    : { status: 'PASS', detail: '' },
};

const failed = Object.values(checks).some((item) => item.status === 'FAIL');
const ready = !failed && untracked.length === 0 ? 'YES' : 'NO';

const report = [
  'VERIFICATION',
  field('build:', show(checks.build)),
  field('types:', show(checks.types)),
  field('lint:', show(checks.lint)),
  field('tests:', show(checks.tests)),
  field('secrets:', show(checks.secrets)),
  field('diff:', `${names.length} files`),
  field('untracked:', `${untracked.length} files`),
  field('ready:', ready),
  ...names.map((name) => `file: ${name}`),
  ...untracked.map((name) => `untracked-file: ${name}`),
];
console.log(report.join('\n'));
process.exit(ready === 'YES' ? 0 : 1);
