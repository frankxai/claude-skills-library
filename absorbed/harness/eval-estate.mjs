import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const pin = '4eb71d92a39cab44ad40ac9d8a6a5ccb4029d6c2';

const expected = [
  'agent-harness-construction',
  'context-budget',
  'cost-aware-llm-pipeline',
  'santa-method',
  'search-first',
  'security-review',
  'strategic-compact',
  'verification-loop',
];

const marks = {
  'agent-harness-construction': [
    'One writer per worktree',
    'ECC `full` profile',
  ],
  'context-budget': [
    '8,000 tokens',
    'saved eval',
    'observer stays off',
  ],
  'cost-aware-llm-pipeline': [
    'Do not invent a dollar figure',
    '--no-daemon',
  ],
  'santa-method': [
    'Stop after three rounds',
    'The author harness does not sign',
  ],
  'search-first': [
    'route_work.py guard',
    'Phone Link',
  ],
  'security-review': [
    'Do not blanket-deny `.env`',
    'AgentShield was not part of this port',
  ],
  'strategic-compact': [
    'What worked',
    'What failed',
    'What is still open',
    'Do not add a second compact hook',
  ],
  'verification-loop': [
    'Prefer `pnpm`',
    'The person who writes this report does not sign the pull request',
  ],
};

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(path, 'utf8');
}

const entries = readdirSync(root, { withFileTypes: true });
const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
if (dirs.join('\n') !== expected.join('\n')) {
  fail(`skill directories are ${dirs.join(', ')}`);
}

for (const name of expected) {
  const skillPath = join(root, name, 'SKILL.md');
  const provenancePath = join(root, name, 'PROVENANCE.json');
  const body = read(skillPath);
  const provenance = JSON.parse(read(provenancePath));

  if (!body.includes('Built on SIP.')) fail(`${name} is missing Built on SIP`);
  if (!/^license: MIT$/m.test(body)) fail(`${name} frontmatter license is not MIT`);
  for (const mark of marks[name]) {
    if (!body.includes(mark)) fail(`${name} is missing "${mark}"`);
  }

  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const namesPipe = /curl[^\n]*\|\s*(?:sh|bash)\b/i.test(line) || /install\.sh/i.test(line);
    const namesObserver = /observe\.sh/i.test(line) || /enable the continuous-learning observer/i.test(line);
    const prohibition = /reject|deny|scan|do not|stays off|prohibition/i.test(line);
    if ((namesPipe || namesObserver) && !prohibition) {
      fail(`${name} instructs a forbidden install or observer line: ${line.trim()}`);
    }
  }

  if (provenance.schema !== 'starlight.absorption-provenance.v1') {
    fail(`${name} provenance schema is ${provenance.schema}`);
  }
  if (provenance.skill !== `harness/${name}`) fail(`${name} provenance skill is ${provenance.skill}`);
  if (provenance.source?.commit !== pin) fail(`${name} pin is ${provenance.source?.commit}`);
  if (provenance.source?.repository !== 'https://github.com/affaan-m/ECC') {
    fail(`${name} source repository is ${provenance.source?.repository}`);
  }
  if (provenance.license !== 'MIT') fail(`${name} provenance license is ${provenance.license}`);
  if (typeof provenance.changed !== 'string' || provenance.changed.length < 25) {
    fail(`${name} changed text is shorter than 25 characters`);
  }
}

const self = statSync(join(root, 'eval-estate.mjs'));
if (!self.isFile()) fail('eval-estate.mjs is missing');

if (failures.length > 0) {
  for (const message of failures) console.error(`FAIL ${message}`);
  console.error(`EVAL FAIL ${failures.length}`);
  process.exit(1);
}

console.log(`EVAL PASS skills=${expected.length} pin=${pin}`);
