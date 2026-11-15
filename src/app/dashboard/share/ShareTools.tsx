"use client";

import { useState } from "react";
import { toast } from "@/components/toast";

type Props = { slug: string; shopUrl: string; products: { id: string; name: string }[] };

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(label, text.replace(/^https?:\/\//, ""));
  } catch {
    toast("Couldn't copy. Press and hold the link to copy it.");
  }
}

export function ShareTools({ slug, shopUrl, products }: Props) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [loaded, setLoaded] = useState(false);
  const imageUrl = productId ? `/s/${slug}/p/${productId}/status-image` : "";
  const productUrl = productId ? `${shopUrl}/p/${productId}` : "";

  return (
    <>
      <div className="kit__item">
        <span className="label">WhatsApp status · 1080 × 1920</span>
        {products.length === 0 ? (
          <p className="small muted" style={{ maxWidth: 220 }}>Add a product to make a status image for it.</p>
        ) : (
          <>
            <div className="status-frame" aria-busy={!loaded}>
              {/* Plain img: this is the exact PNG that gets downloaded. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={imageUrl} src={imageUrl} alt="Status image preview" width={180} height={320} onLoad={() => setLoaded(true)} />
            </div>
            <div className="status-picker">
              <label className="label" htmlFor="status-product">Product</label>
              <select className="input" id="status-product" value={productId} onChange={(e) => { setLoaded(false); setProductId(e.target.value); }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
      <div className="kit__actions">
        <button className="btn" type="button" onClick={() => copy(shopUrl, "Stall link copied")}>Copy stall link</button>
        {productId && <a className="btn btn--ghost" href={imageUrl} download={`stall-${slug}-status.png`}>Download status image</a>}
        {productId && <button className="btn btn--ghost" type="button" onClick={() => copy(productUrl, "Product link copied")}>Copy product link</button>}
        <a className="btn btn--ghost" href={`https://wa.me/?text=${encodeURIComponent(`See everything I sell and order on WhatsApp: ${shopUrl}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp ↗</a>
      </div>
    </>
  );
}
