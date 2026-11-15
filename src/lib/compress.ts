"use client";

export type Compressed = { blob: Blob; width: number; height: number };

/**
 * Shrinks a phone photo before upload: longest side 1600px, JPEG ~82%. A 4 MB camera shot
 * usually becomes 200–400 KB, which matters on slow 4G. JPEG (not WebP) so share images can use it too.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Compressed> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && file.type !== "") {
    throw new Error("Only photos (JPG, PNG or WebP) can be added.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("This photo couldn't be opened. Try a JPG or PNG.");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't prepare the photo.");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Your browser couldn't prepare the photo.");
  return { blob, width, height };
}

export async function uploadImage(url: string, file: File, fields: Record<string, string>): Promise<{ url: string; id?: string; width?: number; height?: number }> {
  const { blob, width, height } = await compressImage(file);
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  body.append("width", String(width));
  body.append("height", String(height));
  for (const [k, v] of Object.entries(fields)) body.append(k, v);
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body });
  } catch {
    throw new Error("No internet. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string; id?: string; width?: number; height?: number };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Couldn't save the photo. Please try again.");
  return { url: data.url, id: data.id, width: data.width, height: data.height };
}
