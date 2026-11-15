import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getDb } from "@/lib/db";
import { countNewOrders } from "@/server/orders";
import { requireOwnerId } from "@/server/session";
import { getOwnerShop } from "@/server/shops";
import { signOutAction } from "./actions";
import { DashboardNav } from "./_components/DashboardNav";

export const metadata: Metadata = { title: "Your stall", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ownerId = await requireOwnerId();
  const db = getDb();
  const shop = await getOwnerShop(db, ownerId);
  const newOrders = shop ? await countNewOrders(db, ownerId) : 0;
  const words = (shop?.name ?? "Your stall").split(" ");
  const emphasis = shop?.emphasis ?? words[words.length - 1];

  return (
    <div className="app">
      <aside className="side" aria-label="Shop navigation">
        <div className="side__top">
          <div className="side__shop">
            <span className="label">Your stall{shop?.isDemo ? " · DEMO" : ""}</span>
            <b>{words.map((w, i) => <span key={i} className={w === emphasis ? "w-heavy" : undefined}>{i ? " " : ""}{w}</span>)}</b>
          </div>
          <ThemeToggle />
        </div>
        <DashboardNav setupDone={!!shop && shop.setupStep >= 6} hasShop={!!shop} newOrders={newOrders} />
        <div className="side__foot">
          <span className="label">Status</span>
          <span style={{ fontWeight: 700 }}>{statusText(shop?.status)}</span>
          {shop && shop.status !== "DRAFT" && <Link className="btn btn--ghost" href={`/s/${shop.slug}`} target="_blank">View storefront ↗</Link>}
          <form action={signOutAction}><button className="signout" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main" id="main">{children}</main>
    </div>
  );
}

function statusText(status?: string) {
  if (status === "OPEN") return "Shutter up · open";
  if (status === "PAUSED") return "Closed for now";
  if (status === "TAKEN_DOWN") return "Taken down";
  return "Shutter down";
}
