"use client";

import { useState } from "react";

const REASONS = [
  ["SCAM", "Looks like a scam or fake shop"],
  ["PROHIBITED", "Sells something illegal or banned"],
  ["OFFENSIVE", "Offensive words or pictures"],
  ["IMPERSONATION", "Pretends to be another business"],
  ["OTHER", "Something else"],
] as const;

/** Reports go to the Stall team (ADMIN_EMAILS), never to the shop. No name or contact is asked for. */
export function ReportForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reason: form.get("reason"), details: form.get("details") ?? "" }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p role="status">Thanks. The Stall team will look at this shop.</p>;
  return (
    <form className="report-form" onSubmit={submit}>
      <p className="small">This goes to the Stall team, not to the shop.</p>
      <div className="form">
        {REASONS.map(([value, label], i) => (
          <label key={value} className="check"><input type="radio" name="reason" value={value} defaultChecked={i === 0} />{label}</label>
        ))}
        <div className="f">
          <label htmlFor="r-details">What happened? (optional)</label>
          <textarea id="r-details" name="details" maxLength={600} />
        </div>
      </div>
      {state === "error" && <p className="err" role="alert">Couldn&apos;t send. Please try again.</p>}
      <button className="btn btn--ghost" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send report"}</button>
    </form>
  );
}
