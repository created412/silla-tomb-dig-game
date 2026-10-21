import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, ARTIFACTS, FRIENDS } from '../src/levels.js';

test('every level names an artifact, 6-cell shape, friends known, no time limit', () => {
  assert.equal(LEVELS.length, 5);
  for (const l of LEVELS) {
    assert.ok(ARTIFACTS[l.id], l.id);
    assert.equal(ARTIFACTS[l.id].shape.length, 6);
    for (const f of l.friends) assert.ok(FRIENDS[f], f);
    assert.equal(l.sunMs, undefined, '해 지기 장치는 제거됨');
    assert.ok(l.rockCoverage >= 0 && l.rockCoverage <= 1);
    assert.ok(l.worms >= 1);
  }
});
