import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";
import { placeOrderSchema } from "@/lib/validation";
import { NotFoundError, UserError } from "@/server/errors";
import { placeOrder, previewDemoOrder } from "@/server/orders";

/** Saves the slip as a preview and returns the exact WhatsApp message. Prices are recalculated here. */
export async function POST(request: Request) {
  if (!rateLimit(`order:${clientKey(request.headers)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many orders from this connection. Please wait a few minutes." }, { status: 429 });
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Please check your order.", field: issue?.path.join(".") }, { status: 400 });
  }

  const db = getDb();
  try {
    const shop = await db.shop.findUnique({ where: { slug: parsed.data.slug }, select: { isDemo: true } });
    if (shop?.isDemo) {
      return NextResponse.json({ demo: true, message: await previewDemoOrder(db, parsed.data, siteUrl()), url: null, code: null });
    }
    const placed = await placeOrder(db, parsed.data, siteUrl());
    return NextResponse.json({ demo: false, message: placed.message, url: placed.url, code: placed.order.code });
  } catch (error) {
    if (error instanceof UserError) return NextResponse.json({ error: error.message, field: error.field }, { status: 400 });
    if (error instanceof NotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("order failed", error);
    return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
