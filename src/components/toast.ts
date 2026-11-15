"use client";

/** Small receipt-style toast. Lives outside React so any handler can call it. */
export function toast(message: string, meta?: string) {
  let wrap = document.querySelector<HTMLDivElement>(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    wrap.setAttribute("role", "status");
    wrap.setAttribute("aria-live", "polite");
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  if (meta) {
    const span = document.createElement("span");
    span.className = "mono";
    span.textContent = meta;
    el.appendChild(span);
  }
  wrap.appendChild(el);
  window.setTimeout(() => el.remove(), 2800);
}
