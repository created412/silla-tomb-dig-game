// 대사 큐. play()는 큐를 교체하고, next()는 한 줄 넘긴다.
export function createDialogue(lines) {
  let queue = [];
  let index = -1;

  const current = () => (index >= 0 && index < queue.length ? queue[index] : null);

  return {
    play(id) {
      queue = lines[id] ?? [];
      index = queue.length ? 0 : -1;
    },
    current,
    next() {
      if (index < 0) return null;
      index += 1;
      if (index >= queue.length) { queue = []; index = -1; return null; }
      return queue[index];
    },
    isPlaying: () => current() !== null,
    playIfIdle(id) {
      if (current() !== null) return false;
      this.play(id);
      return true;
    },
  };
}
