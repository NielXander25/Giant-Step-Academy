import { createHash } from "node:crypto";
import { ALLOWED_FORMATS, UPLOAD_FOLDER } from "./images";

/** Cloudinary's signature: the sorted "key=value" pairs joined with &, plus the secret, hashed with SHA-1. */
export function signParams(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

export type UploadTicket = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; allowedFormats: string };

/** Everything the browser needs to upload ONE picture straight to Cloudinary. The secret never leaves the server. */
export function makeUploadTicket(env: { cloudName?: string; apiKey?: string; apiSecret?: string }, now: number = Date.now()): UploadTicket | null {
  if (!env.cloudName || !env.apiKey || !env.apiSecret) return null;
  const timestamp = Math.floor(now / 1000);
  const signature = signParams({ allowed_formats: ALLOWED_FORMATS, folder: UPLOAD_FOLDER, timestamp }, env.apiSecret);
  return { cloudName: env.cloudName, apiKey: env.apiKey, timestamp, signature, folder: UPLOAD_FOLDER, allowedFormats: ALLOWED_FORMATS };
}
