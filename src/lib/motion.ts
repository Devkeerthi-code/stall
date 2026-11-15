/** Tiny damped-spring runtime for the signature moments. Animates transform/opacity only. Browser-only. */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Cheap phones and data-saver mode skip ambient physics (idle swings, tilt). */
export function isLiteDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  return !!nav.connection?.saveData || (cores <= 4 && memory <= 4);
}

export type SpringOptions = {
  from: number;
  to: number;
  stiffness?: number;
  damping?: number;
  velocity?: number;
  precision?: number;
  onUpdate: (value: number) => void;
  onDone?: () => void;
};

export type SpringHandle = { stop: () => void; velocity: () => number };

/** Semi-implicit Euler in 4 ms substeps so it stays stable on slow frames. */
export function spring(opts: SpringOptions): SpringHandle {
  const { to, stiffness: k = 200, damping: c = 20, precision: eps = 0.001 } = opts;
  let x = opts.from;
  let v = opts.velocity ?? 0;
  let last = 0;
  let raf = 0;
  let done = false;

  if (prefersReducedMotion()) {
    opts.onUpdate(to);
    opts.onDone?.();
    return { stop: () => undefined, velocity: () => 0 };
  }

  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(safety);
    opts.onUpdate(to);
    opts.onDone?.();
  };
  // Browsers pause animation frames in hidden tabs and some battery savers; never leave a moment half-done.
  const safety = window.setTimeout(finish, 2000);

  const frame = (now: number) => {
    if (done) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      v += (-k * (x - to) - c * v) * h;
      x += v * h;
    }
    if (Math.abs(v) < eps * 20 && Math.abs(x - to) < eps) {
      finish();
      return;
    }
    opts.onUpdate(x);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    stop: () => { done = true; cancelAnimationFrame(raf); window.clearTimeout(safety); },
    velocity: () => v,
  };
}

/** 1. Rolling shutter: a short tug down, then a spring up into the housing. */
export function liftShutter(shutter: HTMLElement, reveal: HTMLElement | null, onDone?: () => void) {
  const set = (p: number) => { shutter.style.transform = `translateY(${-p * 100}%)`; };
  spring({
    from: 0, to: -0.04, stiffness: 900, damping: 40, precision: 0.002, onUpdate: set,
    onDone: () => spring({
      from: -0.04, to: 1.02, stiffness: 140, damping: 20, precision: 0.002,
      onUpdate: (p) => {
        set(p);
        if (reveal) {
          const clamped = Math.min(1, Math.max(0, p));
          reveal.style.transform = `scale(${0.97 + 0.03 * clamped})`;
          reveal.style.opacity = String(Math.min(1, clamped * 1.4));
        }
      },
      onDone: () => { shutter.hidden = true; onDone?.(); },
    }),
  });
}

/** 5. Stamp press: drops from 1.7x with a stiff spring at a slight random angle; the ledger row takes the hit. */
export function pressStamp(stamp: HTMLElement) {
  const rot = (-2 - Math.random() * 5).toFixed(1);
  stamp.style.setProperty("--rot", `${rot}deg`);
  const row = stamp.closest<HTMLElement>("[data-row]");
  spring({
    from: 1.7, to: 1, stiffness: 700, damping: 30, precision: 0.002,
    onUpdate: (s) => {
      stamp.style.transform = `rotate(${rot}deg) scale(${s})`;
      stamp.style.opacity = String(Math.min(1, Math.max(0, (1.75 - s) / 0.45)));
    },
    onDone: () => {
      stamp.style.transform = "";
      if (row && !prefersReducedMotion()) {
        row.classList.remove("is-hit");
        void row.offsetWidth;
        row.classList.add("is-hit");
      }
    },
  });
}

/** 2b. The slip folds into the WhatsApp button, then the button takes the press. */
export function foldInto(el: HTMLElement, target: HTMLElement, onDone?: () => void) {
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const sx = b.width / a.width;
  const sy = b.height / a.height;
  el.style.transformOrigin = "50% 50%";
  spring({
    from: 0, to: 1, stiffness: 320, damping: 30, precision: 0.002,
    onUpdate: (p) => {
      const q = Math.min(1, p);
      el.style.transform = `translate(${(dx * p).toFixed(1)}px, ${(dy * p).toFixed(1)}px) scale(${(1 + (sx - 1) * q).toFixed(3)}, ${(1 + (sy - 1) * q).toFixed(3)})`;
      el.style.opacity = String(1 - Math.max(0, (q - 0.55) / 0.45));
    },
    onDone: () => {
      spring({
        from: 0.9, to: 1, stiffness: 500, damping: 18, precision: 0.002,
        onUpdate: (s) => { target.style.transform = `scale(${s})`; },
        onDone: () => { target.style.transform = ""; },
      });
      onDone?.();
    },
  });
}
