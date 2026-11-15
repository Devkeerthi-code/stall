import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const blobMocks = vi.hoisted(() => ({
  put: vi.fn(async (pathname: string) => ({ url: `https://abc.public.blob.vercel-storage.com/${pathname}` })),
  del: vi.fn(async () => undefined),
}));
vi.mock("@vercel/blob", () => blobMocks);

import { checkUpload, sniffImage } from "@/lib/images";
import { createStorage } from "@/lib/storage";
import { VercelBlobStorage } from "@/lib/storage/blob";
import { LocalDiskStorage } from "@/lib/storage/local";

const KEY = "clshop0000000000000000001/0123456789abcdef.webp";
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0]);

describe("storage selection", () => {
  it("uses local disk without a Blob token and Blob with one", () => {
    expect(createStorage({}).kind).toBe("local");
    expect(createStorage({ BLOB_READ_WRITE_TOKEN: "  " }).kind).toBe("local");
    expect(createStorage({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" }).kind).toBe("blob");
  });
});

describe("LocalDiskStorage", () => {
  const dirs: string[] = [];
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "stall-"));
    dirs.push(dir);
  });
  afterAll(async () => {
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  });

  it("writes under the root and returns a /media URL", async () => {
    const local = new LocalDiskStorage(dir);
    const file = await local.put(KEY, WEBP);
    expect(file).toEqual({ url: `/media/${KEY}`, key: KEY });
    expect(new Uint8Array(await readFile(path.join(dir, ...KEY.split("/"))))).toEqual(WEBP);
    await local.remove(KEY);
    await expect(readFile(path.join(dir, ...KEY.split("/")))).rejects.toThrow();
    await expect(local.remove(KEY)).resolves.toBeUndefined();
  });

  it("refuses keys that could escape the folder", async () => {
    const local = new LocalDiskStorage(dir);
    for (const bad of ["../etc/passwd", "clshop0000000000000000001/../../x.webp", "a/b.exe", "/abs/x.webp"]) {
      await expect(local.put(bad, WEBP)).rejects.toThrow(/Invalid storage key/);
    }
  });
});

describe("VercelBlobStorage", () => {
  it("uploads publicly under stall/ and deletes by URL", async () => {
    const blob = new VercelBlobStorage("token-123");
    const file = await blob.put(KEY, WEBP, "image/webp");
    expect(blobMocks.put).toHaveBeenCalledWith(`stall/${KEY}`, expect.any(Buffer), expect.objectContaining({
      access: "public", contentType: "image/webp", token: "token-123", addRandomSuffix: false,
    }));
    expect(file.key).toBe(file.url);
    await blob.remove(file.key);
    expect(blobMocks.del).toHaveBeenCalledWith(file.url, { token: "token-123" });
  });
});

describe("upload checks", () => {
  it("trusts file bytes, not names", () => {
    expect(sniffImage(WEBP)?.mime).toBe("image/webp");
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))?.ext).toBe("png");
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("rejects empty and oversized files", () => {
    expect(checkUpload(new Uint8Array()).ok).toBe(false);
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    big.set(WEBP);
    expect(checkUpload(big)).toMatchObject({ ok: false, message: expect.stringMatching(/2 MB/) });
  });
});
