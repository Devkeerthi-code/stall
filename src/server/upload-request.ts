import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/images";
import { NotFoundError, UserError } from "@/server/errors";
import type { UploadInput } from "@/server/photos";

/** Shared parsing for photo uploads. Size is checked before the body is read into memory. */
export async function readUpload(request: Request): Promise<{ ownerId: string; form: FormData; upload: UploadInput } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: "Photo is larger than 2 MB." }, { status: 413 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo was attached." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    ownerId: session.user.id,
    form,
    upload: { bytes, width: Number(form.get("width")), height: Number(form.get("height")) },
  };
}

export function uploadError(error: unknown): NextResponse {
  if (error instanceof UserError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof NotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
  console.error("upload failed", error);
  return NextResponse.json({ error: "Couldn't save the photo. Please try again." }, { status: 500 });
}
