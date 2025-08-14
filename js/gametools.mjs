/** Simple reusable countdown
 *  @param {Object} cfg
 *  @param {number} cfg.seconds - initial seconds
 *  @param {(s:number)=>void} [cfg.onTick] - callback every second
 *  @param {()=>void} [cfg.onDone] - callback on reaching 0
 *  @returns {{start:Function, stop:Function, remaining:number, running:boolean}}
 */
export function makeCountdown({ seconds, onTick, onDone }) {
  let remain = Math.max(0, Number(seconds) || 0);
  let id = null;

  const api = {
    start() {
      api.stop();
      onTick?.(remain);
      id = setInterval(() => {
        remain -= 1;
        onTick?.(remain);
        if (remain <= 0) {
          api.stop();
          onDone?.();
        }
      }, 1000);
      return api;
    },
    stop() {
      if (id) {
        clearInterval(id);
        id = null;
      }
      return api;
    },
    get remaining() { return remain; },
    get running() { return id !== null; }
  };

  return api;
}

export function shuffle(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleDistinct(arr, n) {
  return shuffle(arr).slice(0, Math.max(0, n|0));
}
