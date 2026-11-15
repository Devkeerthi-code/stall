"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { formatRupees } from "@/lib/money";
import type { StorefrontProduct } from "@/server/storefront";
import { PriceTag } from "./PriceTag";
import { useStore } from "./StoreProvider";

type Props = { products: StorefrontProduct[]; categories: { id: string; name: string }[] };

function minPrice(p: StorefrontProduct): number {
  return Math.min(...p.variants.map((v) => v.pricePaise));
}

export function Shelf({ products, categories }: Props) {
  const { t, slug } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sheet, setSheet] = useState<StorefrontProduct | null>(null);
  const deferred = useDeferredValue(query);

  const visible = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    const catName = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
    return products.filter((p) => (!category || p.categoryId === category) && (!q
      || p.name.toLowerCase().includes(q)
      || (p.description ?? "").toLowerCase().includes(q)
      || (p.categoryId ? catName.get(p.categoryId)?.includes(q) : false)));
  }, [products, categories, category, deferred]);

  let featuredIndex = 0;

  return (
    <>
      <div className="finder">
        <div className="search">
          <label className="sr-only" htmlFor="q">{t("search")}</label>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" /><path d="M13 13l5 5" /></svg>
          <input id="q" type="search" autoComplete="off" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {categories.length > 1 && (
          <div className="chips" role="group" aria-label="Categories">
            <button className="chip" type="button" aria-pressed={!category} onClick={() => setCategory(null)}>{t("all")}</button>
            {categories.map((c) => (
              <button key={c.id} className="chip" type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}</button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="empty-results">{t("noResults")}</p>
      ) : (
        <ul className="grid">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} slug={slug} eager={i < 2} tagIndex={p.featured ? featuredIndex++ : -1} onChoose={() => setSheet(p)} />
          ))}
        </ul>
      )}
      {sheet && <VariantSheet product={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}

function ProductCard({ product, slug, eager, tagIndex, onChoose }: { product: StorefrontProduct; slug: string; eager: boolean; tagIndex: number; onChoose: () => void }) {
  const { t, add, qtyOfProduct, acceptsOrders } = useStore();
  const photo = product.photos[0];
  const min = minPrice(product);
  const many = product.variants.length > 1;
  const inSlip = qtyOfProduct(product.id);
  const href = `/s/${slug}/p/${product.id}`;

  function onAdd() {
    if (many) onChoose();
    else if (product.variants[0]) add(product.variants[0].id);
  }

  return (
    <li className="card" data-out={!product.available} data-tag-host>
      {product.featured && product.available && <PriceTag price={formatRupees(min)} label={t("featured")} index={tagIndex} />}
      <Link className="card__photo" href={href} aria-label={product.name}>
        {photo ? (
          <Image src={photo.url} alt="" fill preload={eager} sizes="(min-width: 1024px) 280px, (min-width: 720px) 33vw, 50vw" />
        ) : (
          <span className="ph-blank" aria-hidden="true">{product.name.slice(0, 1)}</span>
        )}
      </Link>
      <div className="card__body">
        <Link className="card__name" href={href}>{product.name}</Link>
        <span className="card__meta">{many ? product.variants.map((v) => v.label).join(" · ") : product.madeToOrder ? <span className="card__mto">{t("madeToOrder")}</span> : null}</span>
        <div className="card__row">
          <span className="price">{many && <small>{t("from")}</small>}{formatRupees(min)}</span>
          {!product.available ? (
            <button className="add" type="button" disabled>{t("out")}</button>
          ) : acceptsOrders ? (
            <button className="add" type="button" onClick={onAdd} aria-label={`${t("add")} ${product.name}`}>
              <span className="plus-icon" aria-hidden="true" /><span>{t("add")}</span>
            </button>
          ) : null}
        </div>
        <span className="in-slip" aria-live="polite">{inSlip ? `${inSlip} ${t("inSlip")}` : ""}</span>
      </div>
    </li>
  );
}

export function VariantSheet({ product, onClose }: { product: StorefrontProduct; onClose: () => void }) {
  const { t, add } = useStore();
  const [chosen, setChosen] = useState(product.variants[0]?.id ?? "");
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <dialog
      className="psheet"
      ref={(el) => {
        dialog.current = el;
        if (el && !el.open) el.showModal();
      }}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      aria-labelledby="ps-name"
    >
      <div className="psheet__in">
        <div className="psheet__top">
          <h2 id="ps-name">{product.name}</h2>
          <button className="sheet-close" type="button" aria-label="Close" onClick={() => dialog.current?.close()} style={{ display: "grid" }}><span className="plus-icon" aria-hidden="true" /></button>
        </div>
        <fieldset className="variants">
          <legend>{t("chooseSize")}</legend>
          {product.variants.map((v) => (
            <label className="variant" key={v.id}>
              <span><input type="radio" name="variant" checked={chosen === v.id} onChange={() => setChosen(v.id)} />{v.label}</span>
              <span className="price">{formatRupees(v.pricePaise)}</span>
            </label>
          ))}
        </fieldset>
        <div className="psheet__actions">
          <button className="btn" type="button" onClick={() => { add(chosen); dialog.current?.close(); }}>{t("addToSlip")}</button>
        </div>
      </div>
    </dialog>
  );
}
