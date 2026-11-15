import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { storage } from "@/lib/storage";
import { replaceShopImage } from "@/server/photos";
import { readUpload, uploadError } from "@/server/upload-request";

export async function POST(request: Request) {
  const parsed = await readUpload(request);
  if (parsed instanceof NextResponse) return parsed;
  const kind = parsed.form.get("kind");
  if (kind !== "logo" && kind !== "banner") return NextResponse.json({ error: "Unknown image type." }, { status: 400 });
  try {
    const file = await replaceShopImage(getDb(), storage(), parsed.ownerId, kind, parsed.upload);
    return NextResponse.json({ url: file?.url });
  } catch (error) {
    return uploadError(error);
  }
}
