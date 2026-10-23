"use client";

import { ALLOWED_FORMATS, MAX_UPLOAD_BYTES } from "./images";

export class UploadError extends Error {}

/** Uploads a picture straight from the browser to Cloudinary using a ticket from our server. Returns the secure address. */
export async function uploadPicture(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new UploadError("Please choose a JPG, PNG or WEBP picture.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`That picture is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Please choose a smaller one.`);

  const ticketRes = await fetch("/api/uploads/sign", { method: "POST" });
  if (ticketRes.status === 503) throw new UploadError("Picture uploads are not set up yet. Paste a picture link instead, or add the Cloudinary settings.");
  if (!ticketRes.ok) throw new UploadError("You are not allowed to upload pictures. Please sign in again.");
  const t = (await ticketRes.json()) as { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; allowedFormats: string };

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", t.apiKey);
  body.append("timestamp", String(t.timestamp));
  body.append("signature", t.signature);
  body.append("folder", t.folder);
  body.append("allowed_formats", t.allowedFormats || ALLOWED_FORMATS);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${t.cloudName}/image/upload`, { method: "POST", body });
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.secure_url) throw new UploadError(data?.error?.message ?? "The upload failed. Please try again.");
  return data.secure_url;
}
