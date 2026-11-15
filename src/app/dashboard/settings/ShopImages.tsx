"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { uploadImage } from "@/lib/compress";
import { removeShopImageAction, setPausedAction } from "../actions";

function Slot({ kind, url, label, hint }: { kind: "logo" | "banner"; url: string | null; label: string; hint: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await uploadImage("/api/shop-image", file, { kind });
      toast(`${label} updated`);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="image-slot">
      <div className={`image-slot__pic${kind === "banner" ? " image-slot__pic--wide" : ""}${busy ? " skeleton" : ""}`}>
        {url && !busy && <Image src={url} alt="" fill sizes="96px" />}
      </div>
      <div className="stack">
        <b className="small">{label}</b>
        <span className="hint small muted">{hint}</span>
        <div className="row">
          <label className="btn btn--ghost" style={{ position: "relative" }}>
            {url ? "Change" : "Add"} {label.toLowerCase()}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ position: "absolute", inset: 0, opacity: 0 }} disabled={busy} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {url && (
            <button className="btn btn--ghost" type="button" disabled={pending} onClick={() => start(async () => { await removeShopImageAction(kind); toast(`${label} removed`); router.refresh(); })}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShopImages({ logoUrl, bannerUrl }: { logoUrl: string | null; bannerUrl: string | null }) {
  return (
    <div>
      <Slot kind="logo" url={logoUrl} label="Logo" hint="Square works best. Shows on your signboard." />
      <Slot kind="banner" url={bannerUrl} label="Banner" hint="A wide photo of your counter or best work, shown under the signboard." />
    </div>
  );
}

export function PauseSwitch({ paused, disabled }: { paused: boolean; disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="notice">
      <span className="small">{paused ? "Your stall shows “Closed for now” and isn't taking orders." : "Going on leave or sold out for the week? Close the stall without losing anything."}</span>
      <button className="btn btn--ghost" type="button" disabled={disabled || pending} aria-busy={pending}
        onClick={() => start(async () => { const r = await setPausedAction(!paused); toast(r.message ?? "Saved"); router.refresh(); })}>
        {paused ? "Open the stall again" : "Close for now"}
      </button>
    </div>
  );
}
