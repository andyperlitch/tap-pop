export function createAudio() {
  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem('tap-pop-muted') === '1';
  } catch {
    muted = false;
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }

  function resume() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  ['pointerdown', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, resume, { passive: true });
  });

  function tone(f1, f2, d, type, v) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + d);
  }

  return {
    get muted() {
      return muted;
    },
    setMuted(value) {
      muted = !!value;
      try {
        localStorage.setItem('tap-pop-muted', muted ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
    toggle() {
      this.setMuted(!muted);
      return muted;
    },
    tap() {
      tone(880, 1320, 0.06, 'square', 0.05);
    },
    pour() {
      tone(180, 90, 0.22, 'sine', 0.08);
    },
    serve() {
      tone(520, 880, 0.12, 'triangle', 0.12);
      setTimeout(() => tone(880, 1240, 0.14, 'triangle', 0.1), 80);
    },
    spoil() {
      tone(220, 80, 0.22, 'sawtooth', 0.12);
    },
    expire() {
      tone(300, 90, 0.28, 'square', 0.08);
    },
    combo() {
      tone(660, 990, 0.1, 'square', 0.08);
      setTimeout(() => tone(990, 1320, 0.12, 'square', 0.07), 70);
    },
    trash() {
      tone(140, 60, 0.12, 'triangle', 0.1);
    },
    special() {
      tone(400, 800, 0.2, 'sine', 0.1);
    },
  };
}
