import type { AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

/**
 * Stands in for next/link in the static demo. App routes such as product pages need the server,
 * so those links become plain text; anything else stays a normal link.
 */
export default function Link({ href, prefetch, children, ...rest }: Props) {
  void prefetch;
  if (href.startsWith("/")) {
    const { className, "aria-label": label } = rest;
    return <span className={className} aria-label={label}>{children}</span>;
  }
  return <a href={href} {...rest}>{children}</a>;
}
