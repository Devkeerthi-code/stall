import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { getInsights } from "@/server/analytics";
import { requireOwnerId } from "@/server/session";
import { PanelHead } from "../_components/PanelHead";
import { requireShopPage } from "../_components/require-shop";

export const metadata: Metadata = { title: "Insights" };

const dayLabel = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

function Tally({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="tally" role="img" aria-label={label}>
      {values.map((v, i) => <span key={i} style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />)}
    </div>
  );
}

export default async function InsightsPage() {
  const ownerId = await requireOwnerId();
  await requireShopPage(ownerId);
  const data = await getInsights(getDb(), ownerId, 7);
  const change = data.previousViews ? Math.round(((data.views - data.previousViews) / data.previousViews) * 100) : null;
  const topMax = Math.max(1, ...data.topProducts.map((p) => p.views));
  const days = data.series.map((d) => dayLabel.format(d.day)).join(", ");

  return (
    <section className="panel" aria-labelledby="insights-h">
      <PanelHead n="03" label="Last 7 days · India time" title="How your stall is" emphasis="doing" />
      <div className="stats">
        <div className="stat">
          <span className="label">Stall views</span>
          <span className="stat__v">{data.views.toLocaleString("en-IN")}</span>
          <Tally values={data.series.map((d) => d.storeViews)} label={`Views per day (${days}): ${data.series.map((d) => d.storeViews).join(", ")}`} />
          <span className="stat__d">{change === null ? "First week of numbers" : `${change >= 0 ? "+" : ""}${change}% vs the week before`}</span>
        </div>
        <div className="stat">
          <span className="label">Most viewed</span>
          <span className="stat__v sm">{data.topProducts[0]?.name ?? "No product views yet"}</span>
          <span className="stat__d">{data.topProducts[0] ? `${data.topProducts[0].views} views` : "Share a product link to see this"}</span>
        </div>
        <div className="stat">
          <span className="label">WhatsApp orders sent</span>
          <span className="stat__v">{data.waClicks.toLocaleString("en-IN")}</span>
          <Tally values={data.series.map((d) => d.waClicks)} label={`Orders sent per day: ${data.series.map((d) => d.waClicks).join(", ")}`} />
          <span className="stat__d">Customers who tapped Send</span>
        </div>
        <div className="stat">
          <span className="label">Views → orders</span>
          <span className="stat__v">{data.conversion === null ? "—" : `${data.conversion}%`}</span>
          <span className="stat__d">{data.waClicks} of {data.views} views</span>
        </div>
      </div>

      <h2 className="step-title" style={{ marginTop: "var(--s-7)", marginBottom: "var(--s-3)" }}>Most viewed products</h2>
      {data.topProducts.length === 0 ? (
        <p className="muted small">No product pages opened this week yet.</p>
      ) : (
        <ol className="top-list">
          {data.topProducts.map((p, i) => (
            <li key={p.id}>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              <span>{p.name}</span>
              <span className="mono">{p.views}</span>
              <span className="bar" aria-hidden="true"><span style={{ transform: `scaleX(${p.views / topMax})` }} /></span>
            </li>
          ))}
        </ol>
      )}

      <details className="plus" style={{ marginTop: "var(--s-6)" }}>
        <summary><span className="plus-icon" aria-hidden="true" />How are these counted?<span className="label">Privacy</span></summary>
        <div className="plus__body">Stall only keeps daily totals: how many times your stall and each product were opened, and how many orders were sent. No cookies, no IP addresses, nothing that identifies a customer.</div>
      </details>
    </section>
  );
}
