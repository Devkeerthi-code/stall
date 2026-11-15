import Link from "next/link";

export default function NotFound() {
  return (
    <main className="store-error" id="main">
      <span className="label">404</span>
      <h1>This counter is <b>empty</b></h1>
      <p className="muted">The link may be mistyped, or the shop hasn&apos;t opened its stall yet.</p>
      <div className="row"><Link className="btn" href="/">Go to Stall</Link></div>
    </main>
  );
}
