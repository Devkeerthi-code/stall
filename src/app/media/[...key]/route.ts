import { readFile } from "node:fs/promises";
import { LocalDiskStorage } from "@/lib/storage/local";
import { STORAGE_KEY_PATTERN } from "@/lib/storage/types";

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

/** Serves photos saved by LocalDiskStorage. Only used when Vercel Blob isn't configured. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!STORAGE_KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(new LocalDiskStorage().resolve(key));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
