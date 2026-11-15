import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { getDb } from "@/lib/db";
import { HowOrdering } from "./HowOrdering";

export const revalidate = 300;

const DEMO_LINKS = [
  { href: "/s/demo-meeras-oven", label: "Home bakery" },
  { href: "/s/demo-kaveri-threads", label: "Boutique" },
];

const WHO = [
  ["Home bakers", "Cakes, cookies and festive boxes, with sizes like ½ kg and 1 kg."],
  ["Boutiques and tailors", "Kurtis and blouses in every size and colour, without forwarding 40 photos."],
  ["Kirana stores", "A running list of what's in stock, with orders for pickup or delivery."],
  ["Tiffin services", "Today's menu and monthly plans, even with late-night hours."],
  ["Handmade sellers", "Candles, pottery, jewellery: one link for the Instagram bio."],
];

async function openStallCount(): Promise<number | null> {
  try {
    return await getDb().shop.count({ where: { status: "OPEN", isDemo: false } });
  } catch {
    return null;
  }
}

export default async function Home() {
  const [session, stalls] = await Promise.all([auth(), openStallCount()]);
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar__in">
          <Wordmark />
          <nav aria-label="Account">
            <ThemeToggle />
            {session?.user ? <Link className="btn" href="/dashboard">Your stall</Link> : <Link className="btn btn--ghost" href="/login">Sign in</Link>}
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="wrap">
            <span className="label">Free for small shops · no commission</span>
            <h1 style={{ marginTop: "var(--s-4)" }}>Your shop&apos;s counter, <b>online</b>.</h1>
            <p>Put everything you sell on one link. Customers browse, fill an order slip and send it to you on WhatsApp. No more forwarding photos, no prices lost in chats.</p>
            <div className="row">
              <Link className="btn btn--accent" href="/signup">Open your stall, free</Link>
              {DEMO_LINKS.map((d) => <Link key={d.href} className="btn btn--ghost" href={d.href}>See a demo: {d.label}</Link>)}
            </div>
            <div className="hero__meta">
              <span className="label">Setup · about 5 minutes</span>
              <span className="label">Customers · no app, no account</span>
              {stalls !== null && stalls > 0 && <span className="label">{stalls} {stalls === 1 ? "stall" : "stalls"} open so far</span>}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="how-h">
          <div className="wrap">
            <div className="section__head"><span className="n">01</span><h2 id="how-h">How ordering <b>works</b></h2></div>
            <HowOrdering />
          </div>
        </section>

        <section className="section" aria-labelledby="who-h">
          <div className="wrap">
            <div className="section__head"><span className="n">02</span><h2 id="who-h">Made for shops <b>near you</b></h2></div>
            <ul className="who">
              {WHO.map(([who, what], i) => (
                <li key={who}><span className="mono">{String(i + 1).padStart(2, "0")}</span><b>{who}</b><span className="muted">{what}</span></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="section__head"><span className="n">03</span><h2 id="faq-h">Plain <b>answers</b></h2></div>
            <details className="plus"><summary><span className="plus-icon" aria-hidden="true" />Does it cost anything?</summary><div className="plus__body">No. Stall takes no commission and has no paid plan. Payment happens between you and your customer, the way it does today (UPI, cash).</div></details>
            <details className="plus"><summary><span className="plus-icon" aria-hidden="true" />Do I need WhatsApp Business?</summary><div className="plus__body">No. Any WhatsApp number works. Orders arrive as a normal message from the customer.</div></details>
            <details className="plus"><summary><span className="plus-icon" aria-hidden="true" />Can my customers use it in their language?</summary><div className="plus__body">Yes. Pick English, Hindi, Tamil, Kannada, Telugu or Malayalam for your storefront buttons and labels. Product names stay exactly as you write them.</div></details>
            <details className="plus"><summary><span className="plus-icon" aria-hidden="true" />What do you know about my customers?</summary><div className="plus__body">Only what goes in an order: name, items, and address if they chose delivery. Visit counts are daily totals. No cookies or IP addresses are stored.</div></details>
          </div>
        </section>
      </main>
      <footer className="wrap foot">
        <span className="label">Stall · a free online counter for small Indian shops</span>
        <Link className="label" href="/signup">Open your stall</Link>
      </footer>
    </>
  );
}
