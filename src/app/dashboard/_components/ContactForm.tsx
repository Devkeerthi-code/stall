"use client";

import { useActionState, useEffect } from "react";
import { Field } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { toast } from "@/components/toast";
import { saveContactAction, type FormState } from "../actions";

export type ContactValues = { whatsapp: string; address: string; mapUrl: string; pickup: boolean; delivery: boolean; deliveryNote: string };

export function ContactForm({ initial, mode }: { initial: ContactValues; mode: "setup" | "settings" }) {
  const [state, action] = useActionState<FormState, FormData>(saveContactAction, {});
  const e = state.errors ?? {};
  // After a failed save the form resets; refill it with what the owner typed, not the old values.
  const v = state.values;
  const text = (key: keyof ContactValues) => v?.[key] ?? String(initial[key]);
  const checked = (key: "pickup" | "delivery") => (v ? v[key] === "on" : initial[key]);
  useEffect(() => { if (state.ok && state.message) toast(state.message); }, [state]);

  return (
    <form action={action} noValidate className="contact-form" key={JSON.stringify(v ?? null)}>
      <input type="hidden" name="mode" value={mode} />
      {e.form && <p className="form-error" role="alert">{e.form}</p>}
      <Field label="WhatsApp number" name="whatsapp" error={e.whatsapp} hint="Orders arrive here as a message from the customer. Stall never messages your customers.">
        <div className="input-prefix">
          <span>+91</span>
          <input className="input" id="f-whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" defaultValue={text("whatsapp")} aria-invalid={!!e.whatsapp} aria-describedby={e.whatsapp ? "f-whatsapp-err" : "f-whatsapp-hint"} required />
        </div>
      </Field>
      <div className="field">
        <span className="label">How customers get their order</span>
        <label className="check"><input type="checkbox" name="pickup" defaultChecked={checked("pickup")} /> Pickup from my place</label>
        <label className="check"><input type="checkbox" name="delivery" defaultChecked={checked("delivery")} /> I deliver</label>
        {e.pickup && <span className="err">{e.pickup}</span>}
      </div>
      <Field label="Delivery or pickup note (optional)" name="deliveryNote" defaultValue={text("deliveryNote")} maxLength={240} placeholder="Delivery within 5 km. Charge shared on WhatsApp." error={e.deliveryNote} />
      <Field label="Address or area (optional)" name="address" defaultValue={text("address")} maxLength={240} placeholder="Jayanagar 4th Block, Bengaluru" autoComplete="street-address" error={e.address} />
      <Field label="Google Maps link (optional)" name="mapUrl" type="url" inputMode="url" defaultValue={text("mapUrl")} placeholder="https://maps.app.goo.gl/…" hint="In Google Maps: tap your place, Share, Copy link." error={e.mapUrl} />
      <div className="step-actions">
        <SubmitButton>{mode === "setup" ? <>Next step <span aria-hidden="true">↗</span></> : "Save contact details"}</SubmitButton>
      </div>
    </form>
  );
}
