import { del, put } from "@vercel/blob";
import { assertKey, type PhotoStorage, type StoredFile } from "./types";

/** Vercel Blob in production. The stored key is the blob URL, which is what del() expects. */
export class VercelBlobStorage implements PhotoStorage {
  readonly kind = "blob" as const;

  constructor(private readonly token: string) {}

  async put(key: string, data: Uint8Array, contentType: string): Promise<StoredFile> {
    const blob = await put(`stall/${assertKey(key)}`, Buffer.from(data), {
      access: "public",
      contentType,
      token: this.token,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return { url: blob.url, key: blob.url };
  }

  async remove(key: string): Promise<void> {
    await del(key, { token: this.token });
  }
}
