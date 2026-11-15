"use client";

import { useEffect } from "react";

/** Counts one view per page per browser tab session. Sends no cookie and nothing about the visitor. */
export function TrackView({ slug, productId }: { slug: string; productId?: string }) {
  useEffect(() => {
    const key = `stall-seen:${slug}:${productId ?? "shop"}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage blocked: still count */ }
    const body = JSON.stringify({ slug, event: productId ? "product_view" : "store_view", productId });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => undefined);
  }, [slug, productId]);
  return null;
}
