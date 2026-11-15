"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { saveProductAction } from "../actions";

type VariantDraft = { key: number; label: string; price: string };

export type ProductDraft = {
  name: string;
  description: string;
  category: string;
  variants: { label: string; price: string }[];
  stockMode: "TRACKED" | "MADE_TO_ORDER";
  stockQty: number | null;
  inStock: boolean;
  featured: boolean;
};

export const EMPTY_PRODUCT: ProductDraft = {
  name: "", description: "", category: "", variants: [{ label: "", price: "" }],
  stockMode: "MADE_TO_ORDER", stockQty: null, inStock: true, featured: false,
};

type Props = { productId: string | null; initial: ProductDraft; categories: string[]; returnTo?: string };

let nextKey = 1;

export function ProductForm({ productId, initial, categories, returnTo }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [variants, setVariants] = useState<VariantDraft[]>(initial.variants.map((v) => ({ ...v, key: nextKey++ })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const many = variants.length > 1;

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setVariant = (key: number, patch: Partial<VariantDraft>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = { ...draft, variants: variants.map(({ label, price }) => ({ label, price })) };
    start(async () => {
      const result = await saveProductAction(payload, productId);
      if (result.errors) {
        setErrors(result.errors);
        toast("Check the highlighted fields");
        return;
      }
      setErrors({});
      toast(result.message ?? "Saved");
      if (!productId && result.id) router.push(`/dashboard/products/${result.id}?added=1${returnTo ? `&from=${returnTo}` : ""}`);
      else router.refresh();
    });
  }

  const err = (key: string) => errors[key];
  const variantError = Object.entries(errors).find(([k]) => k.startsWith("variants"))?.[1];

  return (
    <form onSubmit={submit} noValidate className="stack-lg">
      {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
      <div className="field">
        <label htmlFor="p-name">Product name</label>
        <input className="input" id="p-name" value={draft.name} maxLength={80} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} required />
        {err("name") && <span className="err">{err("name")}</span>}
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: "var(--s-2)" }}>{many ? "Sizes and prices" : "Price"}</legend>
        {variants.map((v, i) => (
          <div className="variant-row" key={v.key}>
            {many || v.label ? (
              <div className="field" style={{ marginTop: 0 }}>
                <label htmlFor={`v-label-${v.key}`}>Size {i + 1}</label>
                <input className="input" id={`v-label-${v.key}`} value={v.label} maxLength={40} placeholder="1/2 kg, Large, Red" onChange={(e) => setVariant(v.key, { label: e.target.value })} />
              </div>
            ) : <span />}
            <div className="field" style={{ marginTop: 0 }}>
              <label htmlFor={`v-price-${v.key}`}>Price</label>
              <div className="input-prefix"><span>₹</span><input className="input mono" id={`v-price-${v.key}`} inputMode="decimal" value={v.price} placeholder="650" onChange={(e) => setVariant(v.key, { price: e.target.value })} /></div>
            </div>
            <button className="icon-btn" type="button" aria-label={`Remove size ${i + 1}`} disabled={variants.length === 1} onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))}>
              <span className="plus-icon" aria-hidden="true" />
            </button>
          </div>
        ))}
        {variantError && <span className="err">{variantError}</span>}
        <div><button className="btn btn--ghost" type="button" disabled={variants.length >= 10} onClick={() => setVariants((vs) => [...vs, { key: nextKey++, label: "", price: "" }])}>Add a size or colour</button></div>
      </fieldset>

      <div className="field">
        <span className="label" id="stock-l">Stock</span>
        <div className="seg-radio" role="radiogroup" aria-labelledby="stock-l">
          <label><input type="radio" name="stockMode" checked={draft.stockMode === "MADE_TO_ORDER"} onChange={() => set("stockMode", "MADE_TO_ORDER")} />Made to order</label>
          <label><input type="radio" name="stockMode" checked={draft.stockMode === "TRACKED"} onChange={() => set("stockMode", "TRACKED")} />I keep stock</label>
        </div>
        {draft.stockMode === "TRACKED" && (
          <div className="field">
            <label htmlFor="p-qty">How many do you have?</label>
            <input className="input mono" id="p-qty" type="number" inputMode="numeric" min={0} max={99999} style={{ maxWidth: 160 }} value={draft.stockQty ?? ""} onChange={(e) => set("stockQty", e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))))} aria-invalid={!!err("stockQty")} />
            <span className="hint">Goes down when you mark an order Confirmed. At 0 it shows as out of stock.</span>
            {err("stockQty") && <span className="err">{err("stockQty")}</span>}
          </div>
        )}
        <label className="check"><input type="checkbox" checked={draft.inStock} onChange={(e) => set("inStock", e.target.checked)} /> Customers can order this now</label>
        <label className="check"><input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature it (gets a hanging price tag)</label>
      </div>

      <div className="field">
        <label htmlFor="p-cat">Category (optional)</label>
        <input className="input" id="p-cat" list="cat-list" value={draft.category} maxLength={40} placeholder="Cakes, Kurtis, Snacks" onChange={(e) => set("category", e.target.value)} />
        <datalist id="cat-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <div className="field">
        <label htmlFor="p-desc">Description (optional)</label>
        <textarea className="input" id="p-desc" value={draft.description} maxLength={600} placeholder="What's in it, sizes, how long it keeps" onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="step-actions">
        <button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : productId ? "Save product" : "Add product"}</button>
      </div>
    </form>
  );
}
