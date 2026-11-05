// The gpu-artist contract as code: WebGL only when the device, the reader's
// preferences and a measured frame cost all allow it. Anything else keeps the CSS glass.

export const FRAME_BUDGET_MS = 8;
export const MIN_DESKTOP_WIDTH = 900;
export const MIN_DEVICE_MEMORY_GB = 4;

export function gpuPlan(env) {
  if (!env.webgl2) return { mode: 'css', reason: 'no WebGL2' };
  if (env.reducedMotion) return { mode: 'css', reason: 'reduced motion requested' };
  if (env.reducedTransparency) return { mode: 'css', reason: 'reduced transparency requested' };
  if (env.saveData) return { mode: 'css', reason: 'data saver on' };
  // navigator.deviceMemory is Chromium-only; absent means unknown, not low.
  if (typeof env.deviceMemory === 'number' && env.deviceMemory < MIN_DEVICE_MEMORY_GB) {
    return { mode: 'css', reason: `device memory ${env.deviceMemory} GB` };
  }
  if (env.viewportWidth < MIN_DESKTOP_WIDTH) return { mode: 'css', reason: 'phone layout' };
  return { mode: 'webgl', reason: 'capable' };
}

// Median, so one slow first frame (shader compile) cannot fail the probe on its own.
export function medianMs(samples) {
  const valid = samples.filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b);
  if (!valid.length) return Infinity;
  const mid = valid.length >> 1;
  return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

export function withinBudget(samples, budgetMs = FRAME_BUDGET_MS) {
  return medianMs(samples) <= budgetMs;
}

export function readEnv(win) {
  const mq = (q) => win.matchMedia(q).matches;
  let webgl2 = false;
  try {
    webgl2 = !!win.document.createElement('canvas').getContext('webgl2');
  } catch {
    webgl2 = false;
  }
  return {
    webgl2,
    reducedMotion: mq('(prefers-reduced-motion: reduce)'),
    reducedTransparency: mq('(prefers-reduced-transparency: reduce)'),
    saveData: !!win.navigator.connection?.saveData,
    deviceMemory: win.navigator.deviceMemory,
    viewportWidth: win.innerWidth,
  };
}
