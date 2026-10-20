import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, ARTIFACTS, FRIENDS } from '../src/levels.js';

test('every level names an artifact, 6-cell shape, friends known, sun decreasing', () => {
  assert.equal(LEVELS.length, 5);
  let prevSun = Infinity;
  for (const l of LEVELS) {
    assert.ok(ARTIFACTS[l.id], l.id);
    assert.equal(ARTIFACTS[l.id].shape.length, 6);
    for (const f of l.friends) assert.ok(FRIENDS[f], f);
    assert.ok(l.sunMs < prevSun); prevSun = l.sunMs;
    assert.ok(l.rockCoverage >= 0 && l.rockCoverage <= 1);
    assert.ok(l.worms >= 1);
  }
});
