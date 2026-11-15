"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { formatRupees } from "@/lib/money";
import { deleteProductAction, toggleStockAction } from "../actions";

type Row = {
  id: string; name: string; category: string | null; featured: boolean; inStock: boolean;
  stockMode: "TRACKED" | "MADE_TO_ORDER"; stockQty: number | null; photo: string | null; prices: number[]; sizes: number;
};

export function ProductRow({ product }: { product: Row }) {
  const [inStock, setOptimistic] = useOptimistic(product.inStock);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const soldOut = product.stockMode === "TRACKED" && (product.stockQty ?? 0) <= 0;
  const available = inStock && !soldOut;
  const min = Math.min(...product.prices);

  function toggle() {
    start(async () => {
      setOptimistic(!inStock);
      const result = await toggleStockAction(product.id, !inStock);
      if (result.errors) toast(Object.values(result.errors)[0] ?? "Couldn't update");
      else toast(!inStock ? "Back on the shelf" : "Marked out of stock", product.name);
    });
  }

  function remove() {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    start(async () => {
      const result = await deleteProductAction(product.id);
      toast(result.errors ? Object.values(result.errors)[0] ?? "Couldn't remove" : "Product removed", product.name);
    });
  }

  const stockText = product.stockMode === "MADE_TO_ORDER" ? "Made to order" : `${product.stockQty ?? 0} left`;

  return (
    <div className="prow" data-in={available} aria-busy={pending}>
      <div className="prow__th">
        {product.photo ? <Image src={product.photo} alt="" fill sizes="56px" /> : <span className="thumb-ph" aria-hidden="true">{product.name.slice(0, 1)}</span>}
      </div>
      <div className="prow__name" style={{ minWidth: 0 }}>
        <Link href={`/dashboard/products/${product.id}`}>
          <b>{product.name}{product.featured && <span className="feat">Featured</span>}</b>
        </Link>
        <span className="mono">{[product.category, product.sizes > 1 ? `${product.sizes} sizes` : null, stockText].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="prow__right">
        <span className="prow__price">{product.prices.length > 1 ? "from " : ""}{formatRupees(min)}</span>
        <span className="prow__stock" data-in={available}>{soldOut ? "Sold out" : available ? "In stock" : "Out of stock"}</span>
        <button className="switch" type="button" role="switch" aria-checked={inStock} aria-label={`${product.name} can be ordered`} onClick={toggle} disabled={pending} />
        <button className={`btn btn--ghost${confirming ? " confirm-danger" : ""}`} type="button" onClick={remove} disabled={pending} style={{ padding: "0 10px" }}>
          {confirming ? "Tap again" : "Remove"}
        </button>
      </div>
    </div>
  );
}
