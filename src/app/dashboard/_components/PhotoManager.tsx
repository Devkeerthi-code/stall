"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/components/toast";
import { uploadImage } from "@/lib/compress";
import { MAX_PHOTOS_PER_PRODUCT } from "@/lib/images";
import { coverPhotoAction, removePhotoAction } from "../actions";

type Photo = { id: string; url: string };

export function PhotoManager({ productId, photos }: { productId: string; photos: Photo[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(0);
  const [pending, start] = useTransition();
  const room = MAX_PHOTOS_PER_PRODUCT - photos.length - uploading;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (chosen.length < files.length) toast(`Up to ${MAX_PHOTOS_PER_PRODUCT} photos per product`);
    setUploading((n) => n + chosen.length);
    for (const file of chosen) {
      try {
        await uploadImage("/api/photos", file, { productId });
      } catch (error) {
        toast(error instanceof Error ? error.message : "Couldn't add that photo");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    router.refresh();
  }

  function act(fn: () => Promise<{ errors?: Record<string, string> }>, done: string) {
    start(async () => {
      const result = await fn();
      toast(result.errors ? Object.values(result.errors)[0] ?? "Something went wrong" : done);
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <span className="label">Photos · {photos.length}/{MAX_PHOTOS_PER_PRODUCT}</span>
      <div className="photos" aria-busy={pending || uploading > 0}>
        {photos.map((p, i) => (
          <div className="photo" key={p.id}>
            <Image src={p.url} alt={`Photo ${i + 1}`} fill sizes="120px" />
            {i === 0 && <span className="photo__cover">Cover</span>}
            <div className="photo__bar">
              {i > 0 ? <button type="button" disabled={pending} onClick={() => act(() => coverPhotoAction(p.id), "Cover photo changed")}>Cover</button> : <span />}
              <button type="button" disabled={pending} onClick={() => act(() => removePhotoAction(p.id), "Photo removed")} aria-label={`Remove photo ${i + 1}`}>Remove</button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => <div className="photo skeleton" key={`u-${i}`} aria-label="Uploading" />)}
        {room > 0 && (
          <label className="photo-add">
            <span>Add photos<br /><span className="mono" style={{ fontSize: 10 }}>JPG · PNG · WebP</span></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="hint small muted">Photos are shrunk on your phone before upload, so they load fast for customers. The first photo shows on your shelf.</p>
    </div>
  );
}
