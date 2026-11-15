import { z } from "zod";
import { getDb } from "@/lib/db";
import { markOrderSent } from "@/server/orders";

const schema = z.object({ slug: z.string().max(40), clientKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/) });

/** Beacon from the "Send on WhatsApp" tap. Moves the order into the shop's inbox; safe to repeat. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const ok = await markOrderSent(getDb(), parsed.data.slug, parsed.data.clientKey);
  return new Response(null, { status: ok ? 204 : 404 });
}
