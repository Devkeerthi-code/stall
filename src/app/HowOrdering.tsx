"use client";

import { useEffect, useRef, useState } from "react";
import { spring, type SpringHandle } from "@/lib/motion";

const STEPS = [
  { title: "Browse the stall", body: "Customers open your link or scan the counter sign. Every product, price and size is on one page, with photos, on any phone. No app, no account." },
  { title: "Fill the order slip", body: "They tap Add on what they want. The slip prints line by line with quantities and the total, worked out in exact paise." },
  { title: "Send on WhatsApp", body: "Before sending they see the exact message. One tap opens WhatsApp with it typed out, addressed to your number. No WhatsApp API, no fees." },
  { title: "Shop confirms", body: "You reply in the chat as usual. The order also lands in your order book with a code like 0142-K7QX, so you can stamp it Confirmed, Ready, Delivered." },
];

/** The home page's interactive strip: each step opens, and a marker springs along the track. */
export function HowOrdering() {
  const [active, setActive] = useState(0);
  const marker = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const anim = useRef<SpringHandle | null>(null);

  useEffect(() => {
    const width = track.current?.clientWidth ?? 0;
    const to = (width - 11) * (active / (STEPS.length - 1));
    const velocity = anim.current?.velocity() ?? 0;
    anim.current?.stop();
    anim.current = spring({
      from: x.current, to, velocity, stiffness: 220, damping: 22, precision: 0.5,
      onUpdate: (v) => { x.current = v; if (marker.current) marker.current.style.transform = `translateX(${v}px)`; },
    });
  }, [active]);

  return (
    <div>
      <div className="how">
        {STEPS.map((step, i) => (
          <div className="how__step" key={step.title} data-on={active === i}>
            <button type="button" aria-expanded={active === i} aria-controls={`how-${i}`} onClick={() => setActive(i)}>
              <span className="label">{String(i + 1).padStart(2, "0")} / 04</span>
              <span className="how__title">{step.title}<span className="plus-icon" aria-hidden="true" /></span>
            </button>
            {active === i && <p className="how__body" id={`how-${i}`}>{step.body}</p>}
          </div>
        ))}
      </div>
      <div className="how__track" ref={track} aria-hidden="true"><span className="how__marker" ref={marker} /></div>
    </div>
  );
}
