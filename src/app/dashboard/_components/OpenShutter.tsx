"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { liftShutter } from "@/lib/motion";
import { openShopAction } from "../actions";

type Props = { shopName: string; shopUrl: string; displayLink: string; ready: boolean; alreadyOpen: boolean };

/** Signature moment 1: the rolling shutter lifts on a spring to reveal the live stall. */
export function OpenShutter({ shopName, shopUrl, displayLink, ready, alreadyOpen }: Props) {
  const shutter = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  // The page refreshes from the server once the stall opens; remember how it started so the lift isn't cut off.
  const [startedOpen] = useState(alreadyOpen);
  const [open, setOpen] = useState(alreadyOpen);
  const [pending, start] = useTransition();

  function lift() {
    start(async () => {
      const result = await openShopAction();
      if (!result.ok) {
        toast(result.message);
        return;
      }
      if (shutter.current) liftShutter(shutter.current, reveal.current, () => setOpen(true));
      else setOpen(true);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      toast("Link copied", displayLink);
    } catch {
      toast("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  return (
    <div className="stack-lg">
      <div className="shutter-frame big-shutter">
        <div className="shutter-housing">
          <span className="label">{shopName}</span>
          <span className="label">{open ? "Shutter up" : "Shutter down"}</span>
        </div>
        <div className="shutter-stage">
          <div className="shutter-reveal" ref={reveal} style={startedOpen ? { opacity: 1 } : undefined} aria-hidden={!open}>
            <span className="label" style={{ color: "var(--ok)" }}>Live</span>
            <h3>Your stall is <b>open</b>.</h3>
            <p className="small muted">Share this link on WhatsApp and Instagram, or print the counter sign.</p>
            <div className="link-box"><code>{displayLink}</code><button type="button" onClick={copy}>Copy</button></div>
            <div className="row">
              <Link className="btn" href="/dashboard/share">Get the counter sign</Link>
              <a className="btn btn--ghost" href={shopUrl} target="_blank" rel="noreferrer">See it as a customer ↗</a>
            </div>
          </div>
          {!startedOpen && (
            <div className="shutter" ref={shutter}>
              <span className="shutter__lock">{ready ? "Ready to open" : "Finish the steps first"}</span>
              <span className="shutter__handle" />
            </div>
          )}
        </div>
      </div>
      {!open && (
        <div className="step-actions">
          <button className="btn btn--accent" type="button" disabled={!ready || pending} onClick={lift} aria-busy={pending}>
            {pending ? "Opening…" : <>Open the shutter <span aria-hidden="true">↗</span></>}
          </button>
        </div>
      )}
    </div>
  );
}
