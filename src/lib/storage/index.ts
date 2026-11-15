import { VercelBlobStorage } from "./blob";
import { LocalDiskStorage } from "./local";
import type { PhotoStorage } from "./types";

export type { PhotoStorage, StoredFile } from "./types";

/** Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise the local disk. */
export function createStorage(env: Record<string, string | undefined> = process.env): PhotoStorage {
  const token = env["BLOB_READ_WRITE_TOKEN"]?.trim();
  return token ? new VercelBlobStorage(token) : new LocalDiskStorage();
}

let cached: PhotoStorage | null = null;
export function storage(): PhotoStorage {
  cached ??= createStorage();
  return cached;
}
