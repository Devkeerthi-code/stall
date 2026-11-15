"use client";

import { useEffect, useRef, useState } from "react";
import { fill } from "@/lib/i18n";
import { DAY_NAMES, formatTime, openState, type OpenState, type WeekHours } from "@/lib/hours";
import { spring, type SpringHandle } from "@/lib/motion";
import { useStore } from "./StoreProvider";

/**
 * Signature moment 3: the Open / Closed board hangs on strings and flips with a spring.
 * The page is cached, so the state is worked out in the customer's browser (India time) and
 * re-checked every minute; it flips live when the shop opens or closes.
 */
export function OpenBoard({ hours, paused }: { hours: WeekHours | null; paused: boolean }) {
  const { t } = useStore();
  const inner = useRef<HTMLSpanElement>(null);
  const angle = useRef(0);
  const anim = useRef<SpringHandle | null>(null);
  const [state, setState] = useState<OpenState | null>(null);

  useEffect(() => {
    if (!hours) return;
    const tick = () => setState(paused ? { isOpen: false, opensAt: null, inDays: null } : openState(hours, new Date()));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [hours, paused]);

  const isOpen = state?.isOpen ?? true;

  useEffect(() => {
    if (!state || !inner.current) return;
    const target = state.isOpen ? 0 : 180;
    if (angle.current === target) return;
    const velocity = anim.current?.velocity() ?? 0;
    anim.current?.stop();
    anim.current = spring({
      from: angle.current, to: target, stiffness: 300, damping: 16, velocity, precision: 0.2,
      onUpdate: (a) => { angle.current = a; if (inner.current) inner.current.style.transform = `rotateY(${a}deg)`; },
    });
  }, [state]);

  if (!hours && !paused) return null;

  let detail = "";
  if (state && state.isOpen) detail = fill(t("closesAt"), { time: formatTime(state.closesAt) });
  else if (state && !state.isOpen && state.opensAt) {
    const time = formatTime(state.opensAt);
    if (state.inDays === 0) detail = fill(t("opensToday"), { time });
    else if (state.inDays === 1) detail = fill(t("opensTomorrow"), { time });
    else detail = fill(t("opensLater"), { time, day: DAY_NAMES[(new Date().getDay() + (state.inDays ?? 0)) % 7] ?? "" });
  }

  return (
    <div className="board" role="status" aria-live="polite" aria-label={`${isOpen ? t("open") : t("closed")}${detail ? `, ${detail}` : ""}`}>
      <span className="board__strings" aria-hidden="true" />
      <span className="board__inner" ref={inner} aria-hidden="true" style={{ visibility: state ? "visible" : "hidden" }}>
        <span className="board__face board__face--open"><span className="board__dot" />{t("open")}</span>
        <span className="board__face board__face--closed">{t("closed")}{detail && <small>{detail}</small>}</span>
      </span>
    </div>
  );
}
