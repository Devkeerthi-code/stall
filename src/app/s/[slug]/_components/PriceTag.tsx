"use client";

import { useEffect, useRef } from "react";
import { isLiteDevice, prefersReducedMotion, spring, type SpringHandle } from "@/lib/motion";

/**
 * Signature moment 4: a hanging price tag on featured items. An underdamped pendulum that swings
 * when tapped or when the pointer brushes past. Idle swings are skipped on low-end phones.
 */
export function PriceTag({ price, label, index }: { price: string; label: string; index: number }) {
  const tag = useRef<HTMLButtonElement>(null);
  const angle = useRef(0);
  const anim = useRef<SpringHandle | null>(null);

  const kick = (velocity: number) => {
    if (prefersReducedMotion() || !tag.current) return;
    const v0 = anim.current?.velocity() ?? 0;
    anim.current?.stop();
    anim.current = spring({
      from: angle.current, to: 0, velocity: Math.max(-260, Math.min(260, v0 + velocity)), stiffness: 200, damping: 14, precision: 0.05,
      onUpdate: (a) => { angle.current = a; if (tag.current) tag.current.style.transform = `rotate(${a}deg)`; },
    });
  };

  useEffect(() => {
    if (isLiteDevice()) return;
    const timer = window.setTimeout(() => kick(index % 2 ? 120 : -140), 500 + index * 140);
    const host = tag.current?.closest<HTMLElement>("[data-tag-host]");
    let lastX = 0;
    let lastT = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const now = performance.now();
      if (now - lastT > 90) {
        const vx = (e.clientX - lastX) / Math.max(16, now - lastT);
        if (lastT && Math.abs(vx) > 0.15) kick(-vx * 120);
        lastX = e.clientX;
        lastT = now;
      }
    };
    host?.addEventListener("pointermove", onMove);
    return () => { window.clearTimeout(timer); host?.removeEventListener("pointermove", onMove); anim.current?.stop(); };
  }, [index]);

  return (
    <button className="ptag" type="button" ref={tag} aria-label={`${label}, ${price}`} onClick={() => kick(index % 2 ? 220 : -220)}>
      <span className="ptag__string" aria-hidden="true" />
      <span className="ptag__card" aria-hidden="true">{price}<small>{label}</small></span>
    </button>
  );
}
