import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTargets, rank, heartbeatStatus } from '../bin/studio-sweep.mjs';

test('heartbeat status comes from what the sweep produced', () => {
  assert.equal(heartbeatStatus(0, 0), 'failed');
  assert.equal(heartbeatStatus(0, 5), 'failed');
  assert.equal(heartbeatStatus(20, 2), 'degraded');
  assert.equal(heartbeatStatus(24, 0), 'ok');
});

const report = (score, p0 = 0) => ({ score, max: 30, findings: Array.from({ length: p0 }, () => ({ severity: 'P0' })) });

test('any P0 outranks a larger weighted deficit', () => {
  const ranked = rank([
    { target: { id: 'flagship', tier: 'tier-1' }, report: report(20) },
    { target: { id: 'satellite', tier: 'tier-3' }, report: report(27, 1) },
  ]);
  assert.deepEqual(ranked.map(r => r.target.id), ['satellite', 'flagship']);
});

test('without P0s, tier weight times deficit decides', () => {
  const ranked = rank([
    { target: { id: 'a', tier: 'tier-3' }, report: report(24) },
    { target: { id: 'b', tier: 'tier-1' }, report: report(27) },
  ]);
  assert.deepEqual(ranked.map(r => [r.target.id, r.opportunity]), [['b', 9], ['a', 6]]);
});

test('failed scans are left out of the ranking', () => {
  assert.equal(rank([{ target: { id: 'x' }, error: 'timeout' }]).length, 0);
});

test('targets load from an array or a properties graph, live only', () => {
  const graph = { properties: [{ id: 'a', url: 'https://a.test', tier: 'tier-1', status: 'live' }, { id: 'b', url: 'https://b.test', status: 'retired' }, null] };
  assert.deepEqual(loadTargets(graph).map(t => t.id), ['a']);
  assert.equal(loadTargets([{ url: 'https://c.test/' }])[0].id, 'c.test');
});

test('duplicate or unsafe ids are rejected before any evidence is written', () => {
  assert.throws(() => loadTargets([{ id: 'x', url: 'https://a.test' }, { id: 'x', url: 'https://b.test' }]), /duplicate/);
  assert.throws(() => loadTargets([{ id: '../etc', url: 'https://a.test' }]), /safe folder/);
  assert.throws(() => loadTargets({ nope: true }), /array/);
});
