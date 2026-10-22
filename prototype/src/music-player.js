// Suno에서 미리 만든 연주곡 한 곡. 대사 중에는 낮추고, 탭을 떠나면 멈춘다.
export function createMusicPlayer(onChange = () => {}) {
  const audio = new Audio();
  audio.id = 'game-bgm'; audio.hidden = true; audio.preload = 'none'; audio.loop = true;
  audio.src = new URL('../assets/music/towoo-adventure.mp3', import.meta.url).href;
  audio.volume = 0;
  if (typeof document !== 'undefined') document.body.append(audio);
  let enabled = true, unlocked = false, hidden = false, speaking = false, pending = false, status = 'ready', fade = null;
  const notify = () => onChange({ enabled, status });
  function gain() {
    clearInterval(fade);
    const target = speaking ? .035 : .18;
    fade = setInterval(() => {
      const delta = target - audio.volume;
      if (Math.abs(delta) <= .015) { audio.volume = target; clearInterval(fade); fade = null; }
      else audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(delta) * .015));
    }, 40);
  }
  function pause() { clearInterval(fade); fade = null; audio.pause(); audio.volume = 0; }
  async function play() {
    if (!enabled || !unlocked || hidden || pending || !audio.paused) return;
    pending = true; status = 'loading'; notify();
    try {
      await audio.play();
      if (!enabled || hidden) pause();
      else { status = 'playing'; gain(); }
    } catch { status = 'blocked'; }
    finally { pending = false; notify(); }
  }
  audio.addEventListener('error', () => { pause(); status = 'unavailable'; notify(); });
  return {
    unlock() { unlocked = true; return play(); },
    toggle() {
      if (enabled && ['blocked', 'unavailable'].includes(status)) { unlocked = true; return play(); }
      enabled = !enabled;
      if (!enabled) { pause(); status = 'paused'; notify(); } else { unlocked = true; return play(); }
    },
    setSpeaking(value) { speaking = value; if (!audio.paused) gain(); },
    setHidden(value) { hidden = value; if (hidden) pause(); else return play(); },
    get enabled() { return enabled; },
  };
}
