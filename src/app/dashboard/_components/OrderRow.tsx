"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "@/components/toast";
import type { OrderStatus } from "@/generated/prisma/enums";
import { formatRupees } from "@/lib/money";
import { pressStamp } from "@/lib/motion";
import { allowedNext, STATUS_LABEL } from "@/lib/order-status";
import { setOrderStatusAction } from "../actions";

export type LedgerOrder = {
  id: string; index: number; code: string; time: string; customerName: string; fulfilment: "PICKUP" | "DELIVERY";
  address: string | null; note: string | null; itemCount: number; totalPaise: number; status: OrderStatus;
  items: { name: string; variantLabel: string; qty: number; linePaise: number }[];
};

/** One ledger line. Changing the status presses a stamp onto the row (signature moment 5). */
export function OrderRow({ order }: { order: LedgerOrder }) {
  const [status, setStatus] = useState(order.status);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const stamp = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const next = allowedNext(status);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [menu]);

  function mark(to: OrderStatus) {
    setMenu(false);
    const previous = status;
    setStatus(to);
    requestAnimationFrame(() => { if (stamp.current) pressStamp(stamp.current); });
    start(async () => {
      const result = await setOrderStatusAction(order.id, to);
      if (result.errors) {
        setStatus(previous);
        toast(Object.values(result.errors)[0] ?? "Couldn't update the order");
      } else {
        toast(`Marked ${STATUS_LABEL[to].toLowerCase()}`, order.code);
      }
    });
  }

  return (
    <>
      <div className="lrow" data-row aria-busy={pending}>
        <span className="ix">{String(order.index).padStart(2, "0")}</span>
        <span className="code">ORD / {order.code}</span>
        <span className="tm">{order.time}</span>
        <span className="cust">{order.customerName}<small>{order.fulfilment === "DELIVERY" ? "DELIVERY" : "PICKUP"}</small></span>
        <span className="its">{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
        <span className="tot">{formatRupees(order.totalPaise)}</span>
        <span className="st" ref={menuRef}>
          <button className="stamp-btn" type="button" aria-haspopup="menu" aria-expanded={menu} disabled={!next.length || pending}
            onClick={() => setMenu((m) => !m)} aria-label={`Status ${STATUS_LABEL[status]}${next.length ? ", change" : ""}`}>
            <span className="stamp" data-s={status.toLowerCase()} ref={stamp}><span>{STATUS_LABEL[status]}</span></span>
          </button>
          {menu && (
            <div className="stamp-menu" role="menu">
              {next.map((s) => <button key={s} type="button" role="menuitem" onClick={() => mark(s)}>Mark {STATUS_LABEL[s].toLowerCase()}</button>)}
            </div>
          )}
        </span>
        <button className="row-toggle" type="button" aria-expanded={open} aria-label={`Details for ${order.code}`} onClick={() => setOpen((o) => !o)}>
          <span className="plus-icon" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="ldetail">
          <ul>
            {order.items.map((item, i) => (
              <li key={i}><span>{item.qty} × {item.name}{item.variantLabel ? ` (${item.variantLabel})` : ""}</span><span>{formatRupees(item.linePaise)}</span></li>
            ))}
            <li><b>Total</b><b>{formatRupees(order.totalPaise)}</b></li>
          </ul>
          <div className="stack small">
            <p><span className="label">How</span><br />{order.fulfilment === "DELIVERY" ? `Delivery to ${order.address ?? "(no address)"}` : "Pickup"}</p>
            {order.note && <p><span className="label">Note</span><br />{order.note}</p>}
            <p className="muted">Reply to the customer in the WhatsApp chat this order came from.</p>
          </div>
        </div>
      )}
    </>
  );
}
