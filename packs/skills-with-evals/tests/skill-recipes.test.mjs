// Checks the feynman-thinking worked example's sync claim: offline edits need an explicit merge.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const PACK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FEYNMAN_MD = readFileSync(join(PACK, 'skills/feynman-thinking/SKILL.md'), 'utf8');

describe('feynman-thinking: worked example', () => {
  const example = FEYNMAN_MD.slice(FEYNMAN_MD.indexOf('## Worked example'), FEYNMAN_MD.indexOf('## Check before sending'));

  it('does not claim that offline appends to one synced file merge on their own', () => {
    assert.doesNotMatch(example, /merge cleanly|conflict-free sync/i);
  });

  it('names an explicit merge mechanism: one file per device, merged and de-duplicated on read', () => {
    assert.match(example, /vault\.\$\{deviceId\}\.jsonl|per device|one file per device/i);
    assert.match(example, /de-?dup/i);
  });
});
