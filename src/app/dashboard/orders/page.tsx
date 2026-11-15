import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { listOwnerOrders, type OrderFilter } from "@/server/orders";
import { requireOwnerId } from "@/server/session";
import { OrderRow } from "../_components/OrderRow";
import { PanelHead } from "../_components/PanelHead";
import { requireShopPage } from "../_components/require-shop";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "All" }, { key: "new", label: "New" }, { key: "open", label: "In progress" }, { key: "done", label: "Done" },
];

const timeFormat = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const ownerId = await requireOwnerId();
  const shop = await requireShopPage(ownerId);
  const raw = (await searchParams).f;
  const filter: OrderFilter = FILTERS.some((f) => f.key === raw) ? (raw as OrderFilter) : "all";
  const orders = await listOwnerOrders(getDb(), ownerId, filter);

  return (
    <section className="panel" aria-labelledby="orders-h">
      <PanelHead n="01" label="Order book" title="Your" emphasis="orders">
        <span className="label">Latest {orders.length}</span>
      </PanelHead>
      <div className="toolbar">
        <nav className="seg" aria-label="Filter orders">
          {FILTERS.map((f) => (
            <Link key={f.key} href={`/dashboard/orders${f.key === "all" ? "" : `?f=${f.key}`}`} aria-current={filter === f.key ? "page" : undefined} className="seg-link">{f.label}</Link>
          ))}
        </nav>
        <span className="small muted">Tap a stamp to move an order along.</span>
      </div>

      {orders.length === 0 ? (
        <div className="state ruled-top">
          {filter === "all" ? (
            <>
              <h3>No orders <b>yet</b></h3>
              <p>When a customer sends their order slip on WhatsApp, it shows up here too, with a code like ORD / 0001-K7QX. Share your stall link to get the first one.</p>
              {shop.status === "OPEN" ? <Link className="btn" href="/dashboard/share">Share your stall</Link> : <Link className="btn" href="/dashboard/setup">Finish setting up</Link>}
            </>
          ) : (
            <><h3>Nothing <b>here</b></h3><p>No orders match this filter.</p></>
          )}
        </div>
      ) : (
        <div className="ledger">
          <div className="ledger__head label" aria-hidden="true"><span /><span>Code</span><span>Time</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span /></div>
          {orders.map((o, i) => (
            <OrderRow
              key={o.id}
              order={{
                id: o.id, index: orders.length - i, code: o.code, time: timeFormat.format(o.sentAt ?? o.createdAt),
                customerName: o.customerName, fulfilment: o.fulfilment, address: o.address, note: o.note,
                itemCount: o.itemCount, totalPaise: o.totalPaise, status: o.status,
                items: o.items.map((it) => ({ name: it.name, variantLabel: it.variantLabel, qty: it.qty, linePaise: it.linePaise })),
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
