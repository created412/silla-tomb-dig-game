import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoicePlayer } from '../prototype/src/voice-player.js';

test('voice player cancels stale loading, stops on advance, replays and mutes without generation calls', async () => {
  const oldAudio = globalThis.Audio, oldFetch = globalThis.fetch;
  let instance, resolveManifest;
  const played = [], states = [], fetched = [];
  globalThis.Audio = class {
    constructor() { instance = this; this.paused = true; this.events = {}; }
    addEventListener(event, callback) { this.events[event] = callback; }
    pause() { this.paused = true; }
    removeAttribute(key) { delete this[key]; }
    load() {}
    async play() { this.paused = false; played.push(this.src); }
  };
  globalThis.fetch = url => { fetched.push(String(url)); return new Promise(resolve => { resolveManifest = resolve; }); };
  try {
    const player = createVoicePlayer(state => states.push(state));
    player.say('first'); player.say('second');
    resolveManifest({ ok: true, json: async () => ({ clips: { first: { file: 'first.mp3' }, second: { file: 'second.mp3' } } }) });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(played.length, 1); assert.match(played[0], /second\.mp3$/);
    assert.equal(instance.playbackRate, .9);
    player.toggleMute(); assert.equal(instance.paused, true); assert.equal(player.muted, true);
    player.say('first'); await new Promise(resolve => setImmediate(resolve)); assert.equal(played.length, 1);
    player.toggleMute(); await new Promise(resolve => setImmediate(resolve)); assert.match(played.at(-1), /first\.mp3$/);
    await player.replay(); assert.match(played.at(-1), /first\.mp3$/);
    instance.events.ended(); assert.equal(states.at(-1).status, 'ended');
    player.stop(); assert.equal(instance.paused, true); assert.equal(instance.src, undefined);
    player.say('missing'); await new Promise(resolve => setImmediate(resolve)); assert.equal(states.at(-1).status, 'unavailable');
    assert.equal(fetched.length, 1); assert.match(fetched[0], /assets\/voices\/manifest\.json$/);
  } finally { globalThis.Audio = oldAudio; globalThis.fetch = oldFetch; }
});
