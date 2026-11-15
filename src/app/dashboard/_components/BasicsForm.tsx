"use client";

import { useActionState, useEffect, useState } from "react";
import { Field } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { toast } from "@/components/toast";
import { contrast, SHOP_COLOUR_PRESETS, shopPalette } from "@/lib/colour";
import { LANGUAGE_NAMES } from "@/lib/i18n";
import { checkSlug, SLUG_MESSAGES, slugify } from "@/lib/slug";
import { LANGUAGES, type Language } from "@/lib/validation";
import { checkSlugAction, saveBasicsAction, type FormState } from "../actions";

export type BasicsValues = { name: string; slug: string; emphasis: string | null; tagline: string | null; accentHex: string; language: Language };

export function BasicsForm({ initial, mode, siteHost }: { initial: BasicsValues | null; mode: "setup" | "settings"; siteHost: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveBasicsAction, {});
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [emphasis, setEmphasis] = useState(initial?.emphasis ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [colour, setColour] = useState(initial?.accentHex ?? SHOP_COLOUR_PRESETS[0]);
  const [taken, setTaken] = useState(false);
  const e = state.errors ?? {};

  const words = name.trim().split(/\s+/).filter(Boolean);
  const heavy = words.includes(emphasis) ? emphasis : words[words.length - 1] ?? "";
  const palette = shopPalette(colour);
  const slugProblem = slug ? checkSlug(slug) : null;

  useEffect(() => {
    if (state.ok && state.message) toast(state.message);
  }, [state]);

  useEffect(() => {
    if (!slug || checkSlug(slug)) return;
    const timer = window.setTimeout(() => {
      checkSlugAction(slug).then((free) => setTaken(!free)).catch(() => setTaken(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [slug]);

  function onName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const slugError = e.slug ?? (slugProblem ? SLUG_MESSAGES[slugProblem] : taken ? SLUG_MESSAGES.taken : undefined);

  return (
    <div className="step-body">
      <form action={action} noValidate>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="emphasis" value={heavy} />
        <input type="hidden" name="accentHex" value={colour} />
        {e.form && <p className="form-error" role="alert">{e.form}</p>}
        <Field label="Shop name" name="name" value={name} onChange={(ev) => onName(ev.target.value)} maxLength={60} required autoComplete="organization" error={e.name} hint="This goes on your signboard." />
        {words.length > 1 && (
          <div className="field">
            <span className="label" id="emph-l">Word to set heavier</span>
            <div className="seg-radio" role="radiogroup" aria-labelledby="emph-l">
              {words.map((w, i) => (
                <label key={`${w}-${i}`}><input type="radio" name="emphasis-pick" checked={heavy === w} onChange={() => setEmphasis(w)} />{w}</label>
              ))}
            </div>
          </div>
        )}
        <Field
          label="Your link" name="slug" value={slug} maxLength={40} required autoCapitalize="none" spellCheck={false}
          onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value.toLowerCase()); setTaken(false); }}
          hint={`${siteHost}/s/${slug || "your-shop"}`} error={slugError}
        />
        <Field label="One line about you (optional)" name="tagline" value={tagline} onChange={(ev) => setTagline(ev.target.value)} maxLength={120} placeholder="Eggless cakes and cookies, baked to order" error={e.tagline} />
        <div className="field">
          <span className="label" id="colour-l">Signboard colour</span>
          <div className="swatches" role="radiogroup" aria-labelledby="colour-l">
            {SHOP_COLOUR_PRESETS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={colour === c} aria-label={c} style={{ "--c": c } as React.CSSProperties} onClick={() => setColour(c)} />
            ))}
            <label className="swatch-custom">
              <span className="sr-only">Any colour</span>
              <input type="color" value={colour} onChange={(ev) => setColour(ev.target.value.toUpperCase())} />
            </label>
          </div>
          <span className="hint mono">Text on it: {contrast(palette.sign, palette.signInk).toFixed(1)}:1 · buttons: {palette.paintLight}. Stall adjusts the shade so it stays easy to read.</span>
        </div>
        <div className="field">
          <label htmlFor="f-language">Storefront language</label>
          <select className="input" id="f-language" name="language" defaultValue={initial?.language ?? "en"}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_NAMES[l]}</option>)}
          </select>
          <span className="hint">Buttons and labels customers see. Your product names stay exactly as you type them.</span>
        </div>
        <div className="step-actions">
          <SubmitButton disabled={!!slugProblem || taken}>{mode === "setup" ? <>Next step <span aria-hidden="true">↗</span></> : "Save signboard"}</SubmitButton>
        </div>
      </form>

      <div aria-hidden="true">
        <span className="label" style={{ display: "block", marginBottom: "var(--s-2)" }}>Signboard preview</span>
        <div className="preview-sign">
          <div className="preview-sign__board" style={{ background: palette.sign, color: palette.signInk }}>
            <p className="nm">{words.length ? words.map((w, i) => <span key={i}>{i ? " " : ""}{w === heavy ? <b>{w}</b> : w}</span>) : <b>Your stall</b>}</p>
            <p style={{ marginTop: "var(--s-3)", fontSize: "var(--t-small)" }}>{tagline || "One line about what you sell"}</p>
          </div>
          <div className="preview-sign__meta mono"><span>/s/{slug || "your-shop"}</span><span className="preview-sign__paint" style={{ "--pl": palette.paintLight, "--pd": palette.paintDark } as React.CSSProperties}>■ button colour</span></div>
        </div>
      </div>
    </div>
  );
}
