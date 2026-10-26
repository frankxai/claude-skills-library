import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SECRET_PATTERNS = [
  /gho_[A-Za-z0-9]{16,}/,
  /ghp_[A-Za-z0-9]{16,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9-_]{20,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /xoxb-[A-Za-z0-9-]{16,}/,
  /re_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
];

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fm;
}

function scanSkillContract(text, expectedName) {
  const fm = parseFrontmatter(text);
  const lines = text.split(/\r?\n/);
  let inFence = false;
  const dollarHits = [];
  const secretHits = [];

  lines.forEach((ln, idx) => {
    if (/^\s*```/.test(ln)) {
      inFence = !inFence;
      return;
    }
    if (ln.includes('lint-allow:')) return;
    if (!inFence && /\$\d/.test(ln)) {
      dollarHits.push(idx + 1);
    }
    for (const re of SECRET_PATTERNS) {
      if (re.test(ln)) secretHits.push(idx + 1);
    }
  });

  const headings = lines.filter((l) => /^#{1,4}\s+\S/.test(l)).length;
  const words = text.split(/\s+/).filter(Boolean).length;

  return {
    fm,
    hasValidFrontmatter: Boolean(
      fm &&
        fm.name === expectedName &&
        fm.description &&
        fm.description.length >= 11 &&
        fm.description.length <= 1024
    ),
    dollarHits,
    secretHits,
    headings,
    words,
  };
}

const TARGET_SKILLS = [
  {
    name: 'book-publishing',
    relPath: 'free-skills/book-publishing/SKILL.md',
  },
  {
    name: 'social-media-strategy',
    relPath: 'free-skills/social-media-strategy/SKILL.md',
  },
  {
    name: 'hooks-automation',
    relPath: 'free-skills/hooks-automation/SKILL.md',
  },
];

describe('Skill Contract Hygiene (T009 & T010)', () => {
  for (const skill of TARGET_SKILLS) {
    describe(skill.name, () => {
      const fullPath = join(ROOT, skill.relPath);
      const raw = readFileSync(fullPath, 'utf8');
      const report = scanSkillContract(raw, skill.name);

      it('has valid YAML frontmatter (name matches slug and description is 11..1024 chars)', () => {
        assert.equal(report.hasValidFrontmatter, true, `Invalid frontmatter in ${skill.relPath}`);
      });

      it('has 0 unguarded $<digit> tokens outside code fences (no-dollar-digit-corruption)', () => {
        assert.deepEqual(
          report.dollarHits,
          [],
          `Unguarded $<digit> tokens found in ${skill.relPath} at lines: ${report.dollarHits.join(', ')}`
        );
      });

      it('has 0 embedded secret patterns', () => {
        assert.deepEqual(
          report.secretHits,
          [],
          `Secret pattern matched in ${skill.relPath} at lines: ${report.secretHits.join(', ')}`
        );
      });

      it('satisfies structural depth (>= 2 headings) and word budget (80..10000 words)', () => {
        assert.ok(report.headings >= 2, `Expected >= 2 headings, got ${report.headings}`);
        assert.ok(
          report.words >= 80 && report.words <= 10000,
          `Expected 80..10000 words, got ${report.words}`
        );
      });
    });
  }

  describe('hooks-automation settings.json contract (T010)', () => {
    const hooksPath = join(ROOT, 'free-skills/hooks-automation/SKILL.md');
    const raw = readFileSync(hooksPath, 'utf8');

    it('documents native Claude Code settings.json lifecycle hooks and exit codes', () => {
      for (const token of [
        'settings.json',
        'PreToolUse',
        'PostToolUse',
        'UserPromptSubmit',
        'Stop',
        'SubagentStop',
        'SessionEnd',
      ]) {
        assert.ok(raw.includes(token), `Expected hooks-automation/SKILL.md to document "${token}"`);
      }
      assert.match(raw, /Exit code `0`/i);
      assert.match(raw, /Exit code `2`/i);
    });
  });

  describe('Planted-fault negative probes', () => {
    const sample = readFileSync(join(ROOT, 'free-skills/book-publishing/SKILL.md'), 'utf8');

    it('detects planted $<digit> outside code fences', () => {
      const mutated = `${sample}\nUnfenced price $100 token.\n`;
      const res = scanSkillContract(mutated, 'book-publishing');
      assert.ok(res.dollarHits.length > 0, 'Expected planted $<digit> to be caught');
    });

    it('detects planted secret token', () => {
      const syntheticToken = ['sk', 'proj', '0'.repeat(24)].join('-');
      const mutated = `${sample}\nexport KEY="${syntheticToken}"\n`;
      const res = scanSkillContract(mutated, 'book-publishing');
      assert.ok(res.secretHits.length > 0, 'Expected planted secret to be caught');
    });
  });
});
