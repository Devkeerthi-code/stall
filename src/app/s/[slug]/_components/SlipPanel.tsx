"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatRupees, lineTotal } from "@/lib/money";
import { foldInto, spring } from "@/lib/motion";
import { useStore } from "./StoreProvider";

type Preview = { message: string; url: string | null; code: string | null; demo: boolean; signature: string };
type Errors = { name?: string; address?: string; form?: string };

const NAME_KEY = "stall-customer-name";

const noSubscribe = () => () => undefined;
function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function newKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

/**
 * Signature moment 2: the order slip. Lines print in receipt style; "Check my order" saves it and
 * shows the exact WhatsApp message; "Send" folds the slip into the green button and opens WhatsApp.
 * Sticky panel on desktop, bottom sheet on phones.
 */
export function SlipPanel() {
  const store = useStore();
  const { t, lines, catalogue, count, totalPaise, change, slug, shopName, sheetOpen, setSheetOpen, acceptsOrders } = store;
  const savedName = useSyncExternalStore(noSubscribe, readSavedName, () => "");
  const [typedName, setName] = useState<string | null>(null);
  const name = typedName ?? savedName;
  const [mode, setMode] = useState<"PICKUP" | "DELIVERY">(store.pickup ? "PICKUP" : "DELIVERY");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saved, setPreview] = useState<Preview | null>(null);
  const keyFor = useRef<{ signature: string; key: string } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ code: string | null; demo: boolean } | null>(null);
  const [printed, setPrinted] = useState<Set<string>>(new Set());
  const panel = useRef<HTMLElement>(null);
  const slip = useRef<HTMLDivElement>(null);
  const waBtn = useRef<HTMLButtonElement>(null);
  const known = useRef<Set<string>>(new Set());
  const bar = useRef<HTMLDivElement>(null);

  // Any change to the order makes the shown preview stale, and the next check uses a fresh idempotency key.
  const signature = JSON.stringify([lines, name.trim(), mode, address.trim(), note.trim()]);
  const preview = saved?.signature === signature ? saved : null;

  // New lines "print" once; quantity changes don't re-print.
  useEffect(() => {
    const fresh = lines.map((l) => l.variantId).filter((id) => !known.current.has(id));
    fresh.forEach((id) => known.current.add(id));
    if (fresh.length) {
      setPrinted(new Set(fresh));
      bar.current?.classList.remove("is-bump");
      void bar.current?.offsetWidth;
      bar.current?.classList.add("is-bump");
    }
  }, [lines]);

  // Mobile sheet slides on a spring.
  useEffect(() => {
    const el = panel.current;
    if (!el || window.matchMedia("(min-width: 1024px)").matches) return;
    if (sheetOpen) el.dataset.open = "true";
    const anim = spring({
      from: sheetOpen ? 105 : 0, to: sheetOpen ? 0 : 105, stiffness: sheetOpen ? 260 : 400, damping: sheetOpen ? 26 : 36, precision: 0.1,
      onUpdate: (y) => { el.style.transform = `translateY(${y}%)`; },
      onDone: () => { if (!sheetOpen) el.dataset.open = "false"; },
    });
    if (sheetOpen) el.querySelector<HTMLElement>("h2")?.focus();
    return () => anim.stop();
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen, setSheetOpen]);

  async function check(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = t("nameErr");
    if (mode === "DELIVERY" && !address.trim()) next.address = t("addressErr");
    setErrors(next);
    if (next.name || next.address) return;
    try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* fine */ }

    if (keyFor.current?.signature !== signature) keyFor.current = { signature, key: newKey() };
    const key = keyFor.current.key;
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, clientKey: key, customerName: name, fulfilment: mode, address, note, lines }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<Preview> & { error?: string };
      if (!response.ok || !data.message) {
        setErrors({ form: data.error ?? t("tryAgain") });
        return;
      }
      setPreview({ message: data.message, url: data.url ?? null, code: data.code ?? null, demo: !!data.demo, signature });
    } catch {
      setErrors({ form: t("offline") });
    } finally {
      setBusy(false);
    }
  }

  function send() {
    const key = keyFor.current?.key;
    if (!preview || !key || !slip.current || !waBtn.current) return;
    const { url, code, demo } = preview;
    if (!demo) {
      const beacon = new Blob([JSON.stringify({ slug, clientKey: key })], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/orders/sent", beacon)) {
        void fetch("/api/orders/sent", { method: "POST", body: beacon, keepalive: true });
      }
    }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setSent({ code, demo });
      store.clear();
      known.current.clear();
      if (url) window.location.href = url;
    };
    foldInto(slip.current, waBtn.current, finish);
    // WhatsApp opens on time even if the animation is throttled.
    window.setTimeout(finish, 450);
  }

  const linesView = lines.flatMap((l) => {
    const e = catalogue.get(l.variantId);
    return e ? [{ ...l, entry: e }] : [];
  });
  const itemsLabel = `${count} ${count === 1 ? t("item") : t("items")}`;

  return (
    <>
      <div className={`backdrop${sheetOpen ? " is-on" : ""}`} onClick={() => setSheetOpen(false)} aria-hidden="true" />
      <aside className="slip-panel" ref={panel} data-open="false" aria-labelledby="slip-h">
        <div className="slip-panel__in">
          <div className="slip-panel__head">
            <h2 id="slip-h" tabIndex={-1}>{t("slip")}</h2>
            <button className="sheet-close" type="button" onClick={() => setSheetOpen(false)} aria-label="Close"><span className="plus-icon" aria-hidden="true" /></button>
          </div>

          {sent ? (
            <div className="sent" role="status" tabIndex={-1}>
              {sent.code && <span className="label" style={{ color: "var(--ok)" }}>{t("orderCode")} · {sent.code}</span>}
              <h3><b>{sent.demo ? t("preview") : t("sent")}</b></h3>
              <p className="muted">{sent.demo ? t("demoNote") : t("sentHint")}</p>
              {sent.code && <Link className="link small" href={`/s/${slug}/order?code=${sent.code}`}>{t("trackTitle")}</Link>}
              <button className="btn btn--ghost" type="button" onClick={() => setSent(null)}>{t("newSlip")}</button>
            </div>
          ) : (
            <>
              <div className="slip" ref={slip}>
                <div className="slip__head"><strong>{shopName}</strong><span style={{ fontSize: 11 }}>{t("slip")}</span></div>
                <div className="slip__meta"><span>{preview?.code ? `ORD / ${preview.code}` : "ORD / ----"}</span><span>{itemsLabel}</span></div>
                <ol className="slip__lines">
                  {linesView.length === 0 ? (
                    <li className="slip__empty">{t("empty")}<br />{t("emptyHint")}</li>
                  ) : linesView.map((l) => (
                    <li className={`slip__line${printed.has(l.variantId) ? " is-printing" : ""}`} key={l.variantId}>
                      <span className="qty">
                        <button type="button" onClick={() => change(l.variantId, -1)} aria-label={`${t("qtyLess")}: ${l.entry.name}`}>−</button>
                        <span>{l.qty}</span>
                        <button type="button" onClick={() => change(l.variantId, 1)} aria-label={`${t("qtyMore")}: ${l.entry.name}`}>+</button>
                      </span>
                      <span>{l.entry.name}<small>{l.entry.label ? `${l.entry.label} · ` : ""}{formatRupees(l.entry.pricePaise)}</small></span>
                      <span>{formatRupees(lineTotal(l.entry.pricePaise, l.qty))}</span>
                    </li>
                  ))}
                </ol>
                <div className="slip__total"><span>{t("total")}</span><b>{formatRupees(totalPaise)}</b></div>
              </div>

              {acceptsOrders && linesView.length > 0 && (
                <form className="form" onSubmit={check} noValidate>
                  {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
                  <div className="f">
                    <label htmlFor="c-name">{t("name")}</label>
                    <input type="text" id="c-name" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-err" : undefined} />
                    {errors.name && <span className="err" id="c-name-err">{errors.name}</span>}
                  </div>
                  {store.pickup && store.delivery && (
                    <fieldset>
                      <legend className="sr-only">{t("pickup")} / {t("delivery")}</legend>
                      <div className="seg-r">
                        <label><input type="radio" name="mode" checked={mode === "PICKUP"} onChange={() => setMode("PICKUP")} /><span>{t("pickup")}</span></label>
                        <label><input type="radio" name="mode" checked={mode === "DELIVERY"} onChange={() => setMode("DELIVERY")} /><span>{t("delivery")}</span></label>
                      </div>
                    </fieldset>
                  )}
                  {mode === "DELIVERY" && (
                    <div className="f">
                      <label htmlFor="c-addr">{t("address")}</label>
                      <textarea id="c-addr" maxLength={240} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} aria-invalid={!!errors.address} />
                      {errors.address && <span className="err">{errors.address}</span>}
                    </div>
                  )}
                  <div className="f">
                    <label htmlFor="c-note">{t("note")}</label>
                    <input type="text" id="c-note" maxLength={240} value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>

                  {preview ? (
                    <>
                      <div className="preview">
                        <span className="label">{t("preview")}</span>
                        <pre className="bubble" aria-live="polite">{preview.message}</pre>
                      </div>
                      {preview.demo && <p className="demo-note">{t("demoNote")}</p>}
                      <button className="btn btn--wa wa-btn" type="button" ref={waBtn} onClick={send}>
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z" /></svg>
                        <span>{t("orderWa")}</span>
                      </button>
                      <button className="btn btn--ghost" type="button" onClick={() => setPreview(null)}>{t("edit")}</button>
                    </>
                  ) : (
                    <button className="btn btn-shop" type="submit" disabled={busy} aria-busy={busy}>{busy ? t("sending") : t("previewBtn")}</button>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </aside>

      <div className="slip-bar" ref={bar} hidden={count === 0 && !sent}>
        <div className="slip-bar__txt"><b>{t("slip")}</b><span>{itemsLabel}</span></div>
        <span className="slip-bar__total">{formatRupees(totalPaise)}</span>
        <button type="button" onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen}>{t("view")}</button>
      </div>
    </>
  );
}
