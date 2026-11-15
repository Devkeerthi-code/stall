import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validation";
import { createReport } from "@/server/admin";
import { NotFoundError } from "@/server/errors";

export async function POST(request: Request) {
  if (!rateLimit(`report:${clientKey(request.headers)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many reports. Please try later." }, { status: 429 });
  }
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick a reason." }, { status: 400 });
  try {
    await createReport(getDb(), parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    throw error;
  }
}
