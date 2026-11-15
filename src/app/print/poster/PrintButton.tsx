"use client";

export function PrintButton() {
  return <button className="btn" type="button" onClick={() => window.print()}>Print A5 sign</button>;
}
