import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMusicPlayer } from '../prototype/src/music-player.js';

test('music waits for interaction, ducks dialogue, preserves mute and pauses in hidden tabs', async () => {
  const oldAudio = globalThis.Audio, oldSet = globalThis.setInterval, oldClear = globalThis.clearInterval;
  const timers = new Map(); let seq = 0, audio, plays = 0;
  globalThis.setInterval = f => { timers.set(++seq, f); return seq; };
  globalThis.clearInterval = id => timers.delete(id);
  const settle = () => { for (let i=0;i<30;i++) for (const f of [...timers.values()]) f(); };
  globalThis.Audio = class {
    constructor() { audio=this; this.paused=true; this.events={}; }
    addEventListener(k,f) { this.events[k]=f; }
    async play() { plays++; this.paused=false; }
    pause() { this.paused=true; }
  };
  try {
    const music=createMusicPlayer(); assert.equal(plays,0); assert.equal(audio.loop,true);
    await music.setHidden(false); assert.equal(plays,0,'visibility cannot start playback without user input');
    await music.unlock(); settle(); assert.equal(plays,1); assert.equal(audio.volume,.18);
    await music.unlock(); assert.equal(plays,1,'dig gestures do not restart the song');
    music.setSpeaking(true); settle(); assert.equal(audio.volume,.035);
    music.setSpeaking(false); settle(); assert.equal(audio.volume,.18);
    music.toggle(); assert.equal(audio.paused,true); await music.unlock(); assert.equal(plays,1,'game taps do not undo mute');
    await music.toggle(); settle(); assert.equal(plays,2);
    music.setHidden(true); assert.equal(audio.paused,true); assert.equal(audio.volume,0);
    await music.setHidden(false); settle(); assert.equal(plays,3); assert.equal(audio.volume,.18);
    music.toggle(); music.setHidden(true); await music.setHidden(false); assert.equal(plays,3,'tab return respects mute');
  } finally { globalThis.Audio=oldAudio; globalThis.setInterval=oldSet; globalThis.clearInterval=oldClear; }
});

test('turning music off while play is pending cannot start it later', async () => {
  const oldAudio=globalThis.Audio; let audio, resolvePlay;
  globalThis.Audio=class {
    constructor(){audio=this;this.paused=true;}
    addEventListener(){}
    play(){return new Promise(r=>{resolvePlay=()=>{this.paused=false;r();};});}
    pause(){this.paused=true;}
  };
  try {const music=createMusicPlayer(),pending=music.unlock();music.toggle();resolvePlay();await pending;assert.equal(audio.paused,true);assert.equal(audio.volume,0);}
  finally {globalThis.Audio=oldAudio;}
});

test('a blocked first playback can be retried with one music button press', async () => {
  const oldAudio=globalThis.Audio; let audio, attempts=0, state;
  globalThis.Audio=class {
    constructor(){audio=this;this.paused=true;}
    addEventListener(){}
    async play(){if(++attempts===1)throw new Error('autoplay blocked');this.paused=false;}
    pause(){this.paused=true;}
  };
  let music;
  try {
    music=createMusicPlayer(value=>{state=value;});
    await music.unlock(); assert.equal(state.status,'blocked');
    await music.toggle(); assert.equal(attempts,2); assert.equal(audio.paused,false);
    assert.equal(state.enabled,true); assert.equal(state.status,'playing');
  } finally {music?.setHidden(true);globalThis.Audio=oldAudio;}
});
