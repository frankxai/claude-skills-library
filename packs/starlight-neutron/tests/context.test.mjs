import test from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contextMain } from '../scripts/context.mjs';

test('contextMain counts bytes and tokens', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'neutron-context-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const configPath = join(dir, 'context.config.json');
  writeFileSync(configPath, JSON.stringify({
    'test-harness': ['file1.md', 'file2.md']
  }));

  writeFileSync(join(dir, 'file1.md'), 'hello world'); // 11 bytes
  writeFileSync(join(dir, 'file2.md'), 'test data'); // 9 bytes

  // Capture stdout
  let out = '';
  const originalLog = console.log;
  console.log = (msg) => { out += msg + '\n'; };

  try {
    const code = contextMain(['--config', configPath]);
    assert.strictEqual(code, 0);
    assert.match(out, /Total bytes: 20/);
    assert.match(out, /Estimated tokens \(bytes\/4\): 5/);
    assert.match(out, /file1.md: 11 bytes/);
    assert.match(out, /file2.md: 9 bytes/);
    assert.doesNotMatch(out, /Proposals/);
  } finally {
    console.log = originalLog;
  }
});

test('contextMain --propose identifies duplicates and long sections', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'neutron-context-test2-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const configPath = join(dir, 'context.config.json');
  writeFileSync(configPath, JSON.stringify({
    'test-harness': ['file1.md', 'file2.md']
  }));

  const paragraph = 'A'.repeat(60);
  const content1 = [
      paragraph,
      '',
      'Some other text',
      '',
      ...Array(100).fill('short line')
  ].join('\n');

  const content2 = [
      'Different file',
      '',
      paragraph
  ].join('\n');

  writeFileSync(join(dir, 'file1.md'), content1);
  writeFileSync(join(dir, 'file2.md'), content2);

  let out = '';
  const originalLog = console.log;
  console.log = (msg) => { out += msg + '\n'; };

  try {
    const code = contextMain(['--config', configPath, '--propose']);
    assert.strictEqual(code, 0);
    assert.match(out, /Proposals \(Heuristics only, files are never edited\)/);
    assert.match(out, /Paragraph duplicated/);
    assert.match(out, /File has over 100 lines/);
  } finally {
    console.log = originalLog;
  }
});

test('contextMain with invalid config', async (t) => {
  let err = '';
  const originalError = console.error;
  console.error = (msg) => { err += msg + '\n'; };

  try {
    const code = contextMain(['--config', 'does-not-exist.json']);
    assert.strictEqual(code, 1);
    assert.match(err, /Config file not found/);
  } finally {
    console.error = originalError;
  }
});

test('contextMain deduplicates overlapping globs', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'neutron-context-test-dedup-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const configPath = join(dir, 'context.config.json');
  // Two patterns that will both match file1.md
  writeFileSync(configPath, JSON.stringify({
    'test-harness': ['file1.md', 'file*.md']
  }));

  writeFileSync(join(dir, 'file1.md'), 'hello world'); // 11 bytes

  // Capture stdout
  let out = '';
  const originalLog = console.log;
  console.log = (msg) => { out += msg + '\n'; };

  try {
    const code = contextMain(['--config', configPath]);
    assert.strictEqual(code, 0);
    // Should be exactly 11 bytes. If it were duplicated it would be 22.
    assert.match(out, /Total bytes: 11/);
  } finally {
    console.log = originalLog;
  }
});
