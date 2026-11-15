import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertKey, type PhotoStorage, type StoredFile } from "./types";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const LOCAL_URL_PREFIX = "/media";

/** Saves files under public/uploads and serves them through the /media route (see app/media). */
export class LocalDiskStorage implements PhotoStorage {
  readonly kind = "local" as const;

  constructor(private readonly root: string = LOCAL_UPLOAD_DIR) {}

  resolve(key: string): string {
    return path.join(this.root, ...assertKey(key).split("/"));
  }

  async put(key: string, data: Uint8Array): Promise<StoredFile> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
    return { url: `${LOCAL_URL_PREFIX}/${key}`, key };
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
