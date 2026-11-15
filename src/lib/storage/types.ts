export type StoredFile = { url: string; key: string };

/** Where product photos, logos and banners live. Swappable so the app runs on a laptop without cloud keys. */
export interface PhotoStorage {
  readonly kind: "local" | "blob";
  put(key: string, data: Uint8Array, contentType: string): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}

/** Keys look like "shopId/abc123.webp". Anything else is refused, which also blocks path tricks like "../". */
export const STORAGE_KEY_PATTERN = /^[a-z0-9]{10,40}\/[a-z0-9-]{8,64}\.(webp|jpg|png)$/;

export function assertKey(key: string): string {
  if (!STORAGE_KEY_PATTERN.test(key)) throw new Error(`Invalid storage key: ${key}`);
  return key;
}
