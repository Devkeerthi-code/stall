import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Wordmark } from "@/components/Wordmark";
import { getDb } from "@/lib/db";
import { adminOverview, dismissReport, restoreShop, takeDownShop } from "@/server/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const date = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

async function takeDown(form: FormData) {
  "use server";
  await requireAdmin();
  await takeDownShop(getDb(), String(form.get("shopId")), String(form.get("reason") || "Reported and reviewed"));
  revalidatePath("/admin");
}

async function restore(form: FormData) {
  "use server";
  await requireAdmin();
  await restoreShop(getDb(), String(form.get("shopId")));
  revalidatePath("/admin");
}

async function dismiss(form: FormData) {
  "use server";
  await requireAdmin();
  await dismissReport(getDb(), String(form.get("reportId")));
  revalidatePath("/admin");
}

export default async function AdminPage() {
  await requireAdmin();
  const { openReports, shops, usage } = await adminOverview(getDb());
  const counters = [
    ["Owners signed up", usage.owner_signed_up], ["Stalls opened", usage.shop_opened], ["Products added", usage.product_added],
    ["CSV imports", usage.csv_imported], ["Orders sent", usage.order_placed],
  ] as const;

  return (
    <>
      <header className="topbar"><div className="wrap topbar__in"><Wordmark /><Link className="btn btn--ghost" href="/dashboard">Your stall</Link></div></header>
      <main className="wrap" id="main" style={{ paddingBottom: "var(--s-8)" }}>
        <section className="section">
          <div className="section__head"><span className="n">A</span><h1 className="panel-title">Platform <b>admin</b></h1></div>
          <div className="stats">
            {counters.map(([label, n]) => (
              <div className="stat" key={label}><span className="label">{label}</span><span className="stat__v">{(n ?? 0).toLocaleString("en-IN")}</span></div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head"><span className="n">01</span><h2>Open <b>reports</b></h2><span className="label">{openReports.length}</span></div>
          {openReports.length === 0 ? <p className="muted">No reports waiting.</p> : (
            <div className="table-scroll">
              <table className="csv-table admin-table">
                <thead><tr><th>Date</th><th>Shop</th><th>Reason</th><th>Details</th><th /></tr></thead>
                <tbody>
                  {openReports.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{date.format(r.createdAt)}</td>
                      <td><a className="link" href={`/s/${r.shop.slug}`} target="_blank" rel="noreferrer">{r.shop.name}</a></td>
                      <td className="mono">{r.reason}</td>
                      <td style={{ whiteSpace: "normal", minWidth: 200 }}>{r.details ?? "—"}</td>
                      <td>
                        <div className="row">
                          {r.shop.status !== "TAKEN_DOWN" && (
                            <form action={takeDown}><input type="hidden" name="shopId" value={r.shop.id} /><input type="hidden" name="reason" value={`Reported: ${r.reason.toLowerCase()}`} /><button className="btn confirm-danger btn--ghost" type="submit">Take down</button></form>
                          )}
                          <form action={dismiss}><input type="hidden" name="reportId" value={r.id} /><button className="btn btn--ghost" type="submit">Dismiss</button></form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="section">
          <div className="section__head"><span className="n">02</span><h2>All <b>stalls</b></h2><span className="label">{shops.length}</span></div>
          <div className="table-scroll">
            <table className="csv-table admin-table">
              <thead><tr><th>Opened</th><th>Shop</th><th>Status</th><th>Products</th><th>Orders</th><th>Reports</th><th /></tr></thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{date.format(s.createdAt)}</td>
                    <td><a className="link" href={`/s/${s.slug}`} target="_blank" rel="noreferrer">{s.name}</a>{s.isDemo && <span className="feat">Demo</span>}</td>
                    <td className="mono">{s.status}</td>
                    <td className="mono">{s._count.products}</td>
                    <td className="mono">{s._count.orders}</td>
                    <td className="mono">{s._count.reports}</td>
                    <td>
                      {s.status === "TAKEN_DOWN" ? (
                        <form action={restore}><input type="hidden" name="shopId" value={s.id} /><button className="btn btn--ghost" type="submit">Restore</button></form>
                      ) : (
                        <form action={takeDown}><input type="hidden" name="shopId" value={s.id} /><button className="btn btn--ghost confirm-danger" type="submit">Take down</button></form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
