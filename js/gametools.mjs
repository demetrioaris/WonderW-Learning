// js/gametools.mjs
// Utilidades comunes para juegos: timer y selección aleatoria

/** Cuenta regresiva simple reutilizable
 *  @param {Object} cfg
 *  @param {number} cfg.seconds - segundos iniciales
 *  @param {(s:number)=>void} [cfg.onTick] - callback cada segundo
 *  @param {()=>void} [cfg.onDone] - callback al llegar a 0
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

/** Baraja un array (Fisher–Yates) sin mutarlo */
export function shuffle(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Toma n elementos distintos del array (barajado) */
export function sampleDistinct(arr, n) {
  return shuffle(arr).slice(0, Math.max(0, n|0));
}
