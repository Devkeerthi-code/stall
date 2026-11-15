export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function shopUrl(slug: string): string {
  return `${siteUrl()}/s/${slug}`;
}

/** "stall.example/s/meeras-oven" style link for printing on signs. */
export function displayUrl(slug: string): string {
  return `${siteUrl().replace(/^https?:\/\//, "")}/s/${slug}`;
}
