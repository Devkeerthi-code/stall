"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="store-error" id="main">
      <span className="label">Something went wrong</span>
      <h1>We couldn&apos;t load <b>this page</b></h1>
      <p className="muted">Check your internet connection. If it keeps happening, try again in a minute.</p>
      <div className="row"><button className="btn" type="button" onClick={reset}>Try again</button></div>
    </main>
  );
}
