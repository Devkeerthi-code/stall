"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { MessageKey } from "@/lib/i18n";
import { lineTotal, sumPaise } from "@/lib/money";

export type CatalogueEntry = { variantId: string; productId: string; name: string; label: string; pricePaise: number; available: boolean };
export type CartLine = { variantId: string; qty: number };

type StoreValue = {
  slug: string;
  shopName: string;
  isDemo: boolean;
  acceptsOrders: boolean;
  pickup: boolean;
  delivery: boolean;
  t: (key: MessageKey) => string;
  lang: string;
  catalogue: Map<string, CatalogueEntry>;
  lines: CartLine[];
  count: number;
  totalPaise: number;
  add: (variantId: string) => void;
  change: (variantId: string, delta: number) => void;
  clear: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  qtyOfProduct: (productId: string) => number;
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

type Props = {
  slug: string; shopName: string; isDemo: boolean; acceptsOrders: boolean; pickup: boolean; delivery: boolean;
  lang: string; dict: Record<MessageKey, string>; entries: CatalogueEntry[]; children: React.ReactNode;
};

const storageKey = (slug: string) => `stall-slip:${slug}`;

function readSlip(slug: string): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(slug)) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((l): l is CartLine => typeof l?.variantId === "string" && Number.isInteger(l?.qty) && l.qty > 0 && l.qty < 100);
  } catch {
    return [];
  }
}

const EMPTY: CartLine[] = [];

/** The slip as a tiny external store over localStorage, so every tab of the shop stays in sync. */
function createSlipStore(slug: string) {
  let cache: CartLine[] | null = null;
  const listeners = new Set<() => void>();
  const get = () => (cache ??= readSlip(slug));
  return {
    get,
    server: () => EMPTY,
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== storageKey(slug)) return;
        cache = null;
        listener();
      };
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
    },
    update(fn: (lines: CartLine[]) => CartLine[]) {
      cache = fn(get());
      try { localStorage.setItem(storageKey(slug), JSON.stringify(cache)); } catch { /* storage full or blocked */ }
      listeners.forEach((l) => l());
    },
  };
}

/** The order slip lives in this browser only (localStorage), per shop. No account, no cookie. */
export function StoreProvider({ slug, shopName, isDemo, acceptsOrders, pickup, delivery, lang, dict, entries, children }: Props) {
  const catalogue = useMemo(() => new Map(entries.map((e) => [e.variantId, e])), [entries]);
  const slip = useMemo(() => createSlipStore(slug), [slug]);
  const stored = useSyncExternalStore(slip.subscribe, slip.get, slip.server);
  // Anything the shop has since removed or sold out quietly drops off the slip.
  const lines = useMemo(() => stored.filter((l) => catalogue.get(l.variantId)?.available), [stored, catalogue]);
  const setLines = slip.update;
  const [sheetOpen, setSheetOpen] = useState(false);

  const add = useCallback((variantId: string) => {
    if (!catalogue.get(variantId)?.available) return;
    setLines((ls) => (ls.some((l) => l.variantId === variantId)
      ? ls.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(99, l.qty + 1) } : l))
      : [...ls, { variantId, qty: 1 }]));
  }, [catalogue, setLines]);

  const change = useCallback((variantId: string, delta: number) => {
    setLines((ls) => ls.flatMap((l) => {
      if (l.variantId !== variantId) return [l];
      const qty = Math.min(99, l.qty + delta);
      return qty > 0 ? [{ ...l, qty }] : [];
    }));
  }, [setLines]);

  const value = useMemo<StoreValue>(() => {
    const priced = lines.flatMap((l) => {
      const e = catalogue.get(l.variantId);
      return e ? [{ ...l, entry: e }] : [];
    });
    return {
      slug, shopName, isDemo, acceptsOrders, pickup, delivery, lang, catalogue, lines, sheetOpen, setSheetOpen, add, change,
      t: (key) => dict[key],
      clear: () => setLines(() => []),
      count: priced.reduce((n, l) => n + l.qty, 0),
      totalPaise: sumPaise(priced.map((l) => lineTotal(l.entry.pricePaise, l.qty))),
      qtyOfProduct: (productId) => priced.filter((l) => l.entry.productId === productId).reduce((n, l) => n + l.qty, 0),
    };
  }, [lines, catalogue, slug, shopName, isDemo, acceptsOrders, pickup, delivery, lang, dict, sheetOpen, add, change, setLines]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
