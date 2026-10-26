export function vibrate(pattern) {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export const haptic = {
  tap() {
    vibrate(8);
  },
  pour() {
    vibrate(18);
  },
  serve() {
    vibrate([12, 30, 24]);
  },
  spoil() {
    vibrate([30, 40, 30]);
  },
  expire() {
    vibrate([40, 50, 80]);
  },
  combo() {
    vibrate([10, 20, 10, 20, 16]);
  },
};
