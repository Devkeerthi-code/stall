import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link className="wordmark" href={href} aria-label="Stall home">
      <i aria-hidden="true"><span /><span /><span /></i>
      Stall
    </Link>
  );
}
