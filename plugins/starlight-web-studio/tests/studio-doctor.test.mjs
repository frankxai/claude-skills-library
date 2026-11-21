import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromiumInstalled } from '../bin/studio-doctor.mjs';

const fresh = () => mkdtempSync(join(tmpdir(), 'studio-doctor-'));

test('an empty chromium revision folder is not a browser', () => {
  const cache = fresh();
  mkdirSync(join(cache, 'chromium-1234'));
  assert.equal(chromiumInstalled({ PLAYWRIGHT_BROWSERS_PATH: cache }), false);
});

test('a revision folder with the browser binary is', () => {
  const cache = fresh();
  mkdirSync(join(cache, 'chromium-1234', 'chrome-win'), { recursive: true });
  writeFileSync(join(cache, 'chromium-1234', 'chrome-win', 'chrome.exe'), '');
  assert.equal(chromiumInstalled({ PLAYWRIGHT_BROWSERS_PATH: cache }), true);
});

test('an explicit executable must exist and look like Chromium', () => {
  const dir = fresh();
  writeFileSync(join(dir, 'node.exe'), '');
  writeFileSync(join(dir, 'chrome.exe'), '');
  assert.equal(chromiumInstalled({ PLAYWRIGHT_CHROMIUM_EXECUTABLE: join(dir, 'node.exe') }), false);
  assert.equal(chromiumInstalled({ PLAYWRIGHT_CHROMIUM_EXECUTABLE: join(dir, 'chrome.exe') }), true);
  assert.equal(chromiumInstalled({ PLAYWRIGHT_CHROMIUM_EXECUTABLE: join(dir, 'missing', 'chrome.exe') }), false);
});

test('a Chromium executable directly in the browsers path counts, without crashing on it', () => {
  const cache = fresh();
  writeFileSync(join(cache, 'chromium'), '');
  assert.equal(chromiumInstalled({ PLAYWRIGHT_BROWSERS_PATH: cache }), true);
});
