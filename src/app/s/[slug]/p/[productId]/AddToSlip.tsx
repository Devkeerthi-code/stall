"use client";

import { useState } from "react";
import { formatRupees } from "@/lib/money";
import type { StorefrontProduct } from "@/server/storefront";
import { useStore } from "../../_components/StoreProvider";

export function AddToSlip({ product }: { product: StorefrontProduct }) {
  const { t, add, acceptsOrders, qtyOfProduct, setSheetOpen } = useStore();
  const [chosen, setChosen] = useState(product.variants[0]?.id ?? "");
  const inSlip = qtyOfProduct(product.id);

  if (!product.available) return <p className="err" style={{ fontWeight: 700 }}>{t("out")}</p>;
  if (!acceptsOrders) return null;

  return (
    <div className="stack">
      {product.variants.length > 1 && (
        <fieldset className="variants">
          <legend>{t("chooseSize")}</legend>
          {product.variants.map((v) => (
            <label className="variant" key={v.id}>
              <span><input type="radio" name="variant" checked={chosen === v.id} onChange={() => setChosen(v.id)} />{v.label}</span>
              <span className="price">{formatRupees(v.pricePaise)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <button className="btn btn-shop" type="button" onClick={() => add(chosen)}>{t("addToSlip")}</button>
      {inSlip > 0 && (
        <button className="link small" type="button" style={{ border: 0, background: "none", padding: 0, textAlign: "left" }} onClick={() => setSheetOpen(true)}>
          {inSlip} {t("inSlip")} · {t("view")}
        </button>
      )}
    </div>
  );
}
