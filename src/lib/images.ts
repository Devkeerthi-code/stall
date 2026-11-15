export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTOS_PER_PRODUCT = 5;

export type ImageKind = { mime: "image/webp" | "image/jpeg" | "image/png"; ext: "webp" | "jpg" | "png" };

/** Checks the file's real bytes, not its name or the browser's claimed type. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const b = (i: number) => bytes[i] ?? -1;
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return { mime: "image/png", ext: "png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

export type ImageCheck = { ok: true; kind: ImageKind } | { ok: false; message: string };

export function checkUpload(bytes: Uint8Array): ImageCheck {
  if (bytes.byteLength === 0) return { ok: false, message: "That file is empty." };
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, message: "Photo is larger than 2 MB even after shrinking. Try another photo." };
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, message: "Only JPG, PNG or WebP photos can be added." };
  return { ok: true, kind };
}
