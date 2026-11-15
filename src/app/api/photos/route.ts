import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { storage } from "@/lib/storage";
import { addProductPhoto } from "@/server/photos";
import { readUpload, uploadError } from "@/server/upload-request";

export async function POST(request: Request) {
  const parsed = await readUpload(request);
  if (parsed instanceof NextResponse) return parsed;
  const productId = String(parsed.form.get("productId") ?? "");
  try {
    const photo = await addProductPhoto(getDb(), storage(), parsed.ownerId, productId, parsed.upload);
    return NextResponse.json({ id: photo.id, url: photo.url, width: photo.width, height: photo.height });
  } catch (error) {
    return uploadError(error);
  }
}
