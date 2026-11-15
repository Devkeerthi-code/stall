import { getDb } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { trackSchema } from "@/lib/validation";
import { trackView } from "@/server/analytics";

/** Daily view counters. The connection key is used only for in-memory rate limiting and never stored. */
export async function POST(request: Request) {
  if (!rateLimit(`track:${clientKey(request.headers)}`, 120, 60_000)) return new Response(null, { status: 429 });
  const parsed = trackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  try {
    await trackView(getDb(), parsed.data.slug, parsed.data.event, parsed.data.productId);
  } catch (error) {
    console.error("track failed", error);
  }
  return new Response(null, { status: 204 });
}
