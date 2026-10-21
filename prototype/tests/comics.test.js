import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMICS } from '../src/comics.js';
import { LEVELS, FRIENDS } from '../src/levels.js';

test('every level has a comic with 3 story panels and 3 choices, exactly one right, all lines ≤ 40 chars', () => {
  for (const l of LEVELS) {
    const c = COMICS[l.id];
    assert.ok(c, `comic for ${l.id}`);
    assert.equal(c.panels.length, 3);
    for (const p of c.panels) { assert.ok(FRIENDS[p.who], p.who); assert.ok([...p.text].length <= 40, p.text); }
    assert.equal(c.choices.length, 3);
    assert.equal(c.choices.filter(x => x.right).length, 1);
    for (const x of c.choices) { assert.ok([...x.text].length <= 40, x.text); assert.ok(FRIENDS[x.gag.who]); assert.ok([...x.gag.text].length <= 40, x.gag.text); }
    assert.ok([...c.question].length <= 40);
  }
});

test('every friend has intro lines, a power description, a real-towoo note and a join level', () => {
  for (const [who, f] of Object.entries(FRIENDS)) {
    assert.ok(f.intro?.length >= 2, who);
    for (const line of f.intro) assert.ok([...line].length <= 40, line);
    assert.ok(f.desc && [...f.desc].length <= 40, who);
    assert.ok(f.real && f.real.length > 10, who);
    assert.ok(Number.isInteger(f.joinsAt) && f.joinsAt >= 0 && f.joinsAt < LEVELS.length, who);
    assert.ok(LEVELS[f.joinsAt].friends.includes(who), `${who} must be usable at its join level`);
    if (f.joinsAt > 0) assert.ok(!LEVELS[f.joinsAt - 1].friends.includes(who), `${who} must not be usable before joining`);
  }
});
