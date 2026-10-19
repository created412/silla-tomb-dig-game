// Web Audio 합성 효과음. 오디오가 막혀도 게임은 계속된다.
export function createSfx() {
  let ctx = null;

  function ac() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  }

  function tone({ type = 'sine', from = 440, to = from, ms = 80, gain = 0.15, at = 0 }) {
    const c = ac();
    if (!c) return;
    try {
      const t0 = c.currentTime + at;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + ms / 1000);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      osc.connect(g).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + ms / 1000 + 0.02);
    } catch { /* 무시 */ }
  }

  let lastRub = 0;
  return {
    unlock() {
      const c = ac();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    rub() {
      const now = performance.now();
      if (now - lastRub < 90) return; // 너무 잦은 소리 방지
      lastRub = now;
      tone({ type: 'sine', from: 90, to: 60, ms: 30, gain: 0.06 });
    },
    tap() { tone({ type: 'square', from: 200, ms: 40, gain: 0.12 }); },
    crack() {
      tone({ type: 'square', from: 320, to: 120, ms: 90, gain: 0.16 });
      tone({ type: 'sine', from: 70, ms: 120, gain: 0.1, at: 0.02 });
    },
    brush() {
      const now = performance.now();
      if (now - lastRub < 120) return;
      lastRub = now;
      tone({ type: 'sine', from: 140, to: 110, ms: 40, gain: 0.04 });
    },
    collapse() { tone({ type: 'sawtooth', from: 220, to: 60, ms: 300, gain: 0.18 }); },
    glimmer() {
      tone({ type: 'sine', from: 880, ms: 90, gain: 0.12 });
      tone({ type: 'sine', from: 1320, ms: 140, gain: 0.12, at: 0.09 });
    },
    found() {
      tone({ type: 'triangle', from: 523, ms: 150, gain: 0.18 });
      tone({ type: 'triangle', from: 659, ms: 150, gain: 0.18, at: 0.15 });
      tone({ type: 'triangle', from: 784, ms: 350, gain: 0.2, at: 0.3 });
    },
  };
}
