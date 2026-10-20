import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels.js';
import { STARS_KEY, loadStars, saveStar, isUnlocked } from '../src/stars-store.js';

function memStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

test('loadStars defaults to zero for every level when storage is empty or missing', () => {
  const zero = Object.fromEntries(LEVELS.map(l => [l.id, 0]));
  assert.deepEqual(loadStars(memStorage()), zero);
  assert.deepEqual(loadStars(null), zero);
});

test('loadStars ignores corrupted JSON and wrong versions without throwing', () => {
  const zero = Object.fromEntries(LEVELS.map(l => [l.id, 0]));
  assert.deepEqual(loadStars(memStorage({ [STARS_KEY]: '{not json' })), zero);
  assert.deepEqual(loadStars(memStorage({ [STARS_KEY]: JSON.stringify({ version: 9, stars: { crown: 3 } }) })), zero);
  assert.deepEqual(loadStars(memStorage({ [STARS_KEY]: JSON.stringify({ version: 1, stars: { crown: 'x', ghost: 3 } }) })), zero);
  const thrower = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadStars(thrower), zero);
});

test('saveStar keeps the best score and persists', () => {
  const s = memStorage();
  let stars = loadStars(s);
  stars = saveStar(s, stars, 'crown', 2);
  assert.equal(stars.crown, 2);
  stars = saveStar(s, stars, 'crown', 1);
  assert.equal(stars.crown, 2);
  stars = saveStar(s, stars, 'crown', 3);
  assert.equal(loadStars(s).crown, 3);
});

test('saveStar still returns the object when storage throws', () => {
  const thrower = { getItem: () => null, setItem() { throw new Error('quota'); } };
  const stars = saveStar(thrower, loadStars(thrower), 'crown', 1);
  assert.equal(stars.crown, 1);
});

test('isUnlocked: first level always, next level needs one star on the previous', () => {
  const stars = loadStars(memStorage());
  assert.equal(isUnlocked(stars, 0), true);
  assert.equal(isUnlocked(stars, 1), false);
  stars.crown = 1;
  assert.equal(isUnlocked(stars, 1), true);
  assert.equal(isUnlocked(stars, 2), false);
});
