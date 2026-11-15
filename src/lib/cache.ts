import { revalidatePath, revalidateTag } from "next/cache";

/** Every storefront read is tagged with its slug, so one call refreshes the shop's pages. */
export function storefrontTag(slug: string): string {
  return `storefront:${slug}`;
}

/** Call after any owner edit that customers can see. Pass the old slug too when the link changes. */
export function revalidateStorefront(...slugs: string[]): void {
  for (const slug of new Set(slugs)) {
    revalidateTag(storefrontTag(slug), { expire: 0 });
    revalidatePath(`/s/${slug}`, "layout");
  }
}
