import { hash, verify } from "@node-rs/argon2";

// Argon2id with library defaults (memory-hard; suitable for passwords).
export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
