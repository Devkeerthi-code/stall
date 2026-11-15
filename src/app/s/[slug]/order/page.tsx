import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/i18n";
import { formatRupees } from "@/lib/money";
import { orderCodeSchema } from "@/lib/validation";
import { getOrderForCustomer } from "@/server/orders";
import { getStorefront } from "@/server/storefront";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Check your order", robots: { index: false } };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string }> };

const STEPS = ["NEW", "CONFIRMED", "READY", "DELIVERED"] as const;
const when = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function TrackOrderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const shop = await getStorefront(slug);
  if (!shop || shop.status === "DRAFT" || shop.status === "TAKEN_DOWN") notFound();
  const t = messages(shop.language);
  const raw = (await searchParams).code;
  const code = raw ? orderCodeSchema.safeParse(raw) : null;
  const order = code?.success ? await getOrderForCustomer(getDb(), slug, code.data) : null;
  const reached = order ? STEPS.indexOf(order.status as (typeof STEPS)[number]) : -1;

  return (
    <>
      <header className="minihead">
        <div className="minihead__in">
          <Link className="back" href={`/s/${shop.slug}`}>← {t.back}</Link>
          <Link href={`/s/${shop.slug}`} style={{ marginLeft: "auto" }}>{shop.name}</Link>
        </div>
      </header>
      <main className="track" id="main">
        <h1>{t.trackTitle}</h1>
        <form method="get">
          <label className="sr-only" htmlFor="code">{t.orderCode}</label>
          <input id="code" name="code" defaultValue={raw ?? ""} placeholder="0142-K7QX" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          <button className="btn" type="submit">{t.trackBtn}</button>
        </form>
        {!raw && <p className="muted small">{t.trackHint}</p>}
        {raw && !order && <p className="notice notice--bad" role="alert">{t.trackNone}</p>}
        {order && (
          <div className="stack-lg">
            {order.status === "CANCELLED" ? (
              <p className="notice notice--bad"><span className="stamp" data-s="cancelled">{t.status_CANCELLED}</span></p>
            ) : (
              <ol className="track-steps">
                {STEPS.map((s, i) => <li key={s} data-done={i <= reached} aria-current={i === reached ? "step" : undefined}>{t[`status_${s}`]}</li>)}
              </ol>
            )}
            <div className="slip">
              <div className="slip__head"><strong>{shop.name}</strong><span style={{ fontSize: 11 }}>ORD / {order.code}</span></div>
              <div className="slip__meta"><span>{when.format(order.createdAt)}</span><span>{t.updated} {when.format(order.statusChangedAt)}</span></div>
              <ol className="slip__lines">
                {order.items.map((item, i) => (
                  <li className="slip__line" key={i} style={{ gridTemplateColumns: "2.4em 1fr auto" }}>
                    <span className="qty" style={{ border: 0 }}>{item.qty}×</span>
                    <span>{item.name}{item.variantLabel && <small>{item.variantLabel}</small>}</span>
                    <span>{formatRupees(item.linePaise)}</span>
                  </li>
                ))}
              </ol>
              <div className="slip__total"><span>{t.total}</span><b>{formatRupees(order.totalPaise)}</b></div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
