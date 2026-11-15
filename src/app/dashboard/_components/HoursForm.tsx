"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { DAY_NAMES, type WeekHours } from "@/lib/hours";
import { saveHoursAction } from "../actions";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, the way shop owners think of the week

export function HoursForm({ initial, mode }: { initial: WeekHours; mode: "setup" | "settings" }) {
  const [hours, setHours] = useState<WeekHours>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(day: number, patch: Partial<WeekHours[number]>) {
    setHours((h) => h.map((d, i) => (i === day ? { ...d, ...patch } : d)));
  }

  function copyMonday() {
    const monday = hours[1];
    if (monday) setHours((h) => h.map((d, i) => (i === 0 ? d : { ...monday })));
  }

  function save() {
    setError(null);
    start(async () => {
      const result = await saveHoursAction(hours, mode);
      if (result?.errors) setError(result.errors.form ?? "Couldn't save hours.");
      else if (result?.ok) toast("Hours saved");
    });
  }

  return (
    <div className="stack">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="hours" role="group" aria-label="Opening hours, India time">
        {ORDER.map((day) => {
          const d = hours[day]!;
          return (
            <div className="hours__row" key={day} data-closed={d.closed}>
              <span className="mono" style={{ fontWeight: 600 }}>{DAY_NAMES[day]}</span>
              <label className="check" style={{ minHeight: 40 }}>
                <input type="checkbox" checked={!d.closed} onChange={(e) => update(day, { closed: !e.target.checked })} /> Open
              </label>
              <div className="times">
                <label className="sr-only" htmlFor={`open-${day}`}>{DAY_NAMES[day]} opens</label>
                <input id={`open-${day}`} type="time" value={d.open} disabled={d.closed} onChange={(e) => update(day, { open: e.target.value })} />
                <span aria-hidden="true">to</span>
                <label className="sr-only" htmlFor={`close-${day}`}>{DAY_NAMES[day]} closes</label>
                <input id={`close-${day}`} type="time" value={d.close} disabled={d.closed} onChange={(e) => update(day, { close: e.target.value })} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint small muted">Closing after midnight is fine, like 6 pm to 2 am for a night tiffin service.</p>
      <div className="step-actions">
        <button className="btn btn--ghost" type="button" onClick={copyMonday}>Same as Monday every day</button>
        <button className="btn" type="button" onClick={save} disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : mode === "setup" ? <>Next step <span aria-hidden="true">↗</span></> : "Save hours"}
        </button>
      </div>
    </div>
  );
}
