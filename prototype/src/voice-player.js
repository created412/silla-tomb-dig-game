// 미리 만든 ElevenLabs 음원만 재생한다. 실행 중 API 호출이나 브라우저 합성은 하지 않는다.
export function createVoicePlayer(onChange = () => {}) {
  const audio = new Audio();
  audio.id = 'story-voice';
  audio.hidden = true;
  // 실제 재생 상태를 브라우저 접근성·검증 도구에서도 확인할 수 있다.
  if (typeof document !== 'undefined') document.body.append(audio);
  audio.preload = 'none';
  audio.playbackRate = 0.9;
  let catalog = {}, current = null, muted = false, token = 0;
  let status = 'idle';
  const notify = () => onChange({ muted, status, available: Boolean(current && catalog[current]) });
  const ready = fetch(new URL('../assets/voices/manifest.json', import.meta.url))
    .then(r => { if (!r.ok) throw new Error('voice manifest'); return r.json(); })
    .then(data => { catalog = data.clips || {}; }).catch(() => {});
  function stop() { token++; audio.pause(); audio.removeAttribute('src'); audio.load(); status = 'idle'; notify(); }
  async function replay() {
    stop(); const turn = token;
    await ready;
    if (turn !== token || muted || !current) return;
    const clip = catalog[current];
    if (!clip) { status = 'unavailable'; notify(); return; }
    audio.src = new URL(`../assets/voices/${clip.file}`, import.meta.url).href;
    audio.playbackRate = 0.9;
    status = 'loading'; notify();
    try { await audio.play(); if (turn === token) { status = 'playing'; notify(); } }
    catch { if (turn === token) { status = 'paused'; notify(); } }
  }
  audio.addEventListener('ended', () => { status = 'ended'; notify(); });
  audio.addEventListener('error', () => { status = 'unavailable'; notify(); });
  return {
    say(key) { current = key; replay(); },
    stop() { current = null; stop(); },
    replay,
    toggleMute() { muted = !muted; if (muted) stop(); else replay(); notify(); },
    get muted() { return muted; },
  };
}
