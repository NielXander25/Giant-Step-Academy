import { db } from "@/lib/db";

// Brute-force protection for the result portal, kept in the access log itself (no extra service needed).
//  - per network (hashed IP): 12 failed tries in 15 minutes
//  - per student:            30 failed tries in an hour
// Blocked tries are logged but never counted, so a block always ends when the window passes.

export const IP_LIMIT = 12;
export const IP_WINDOW_MINUTES = 15;
export const STUDENT_LIMIT = 30;
export const STUDENT_WINDOW_MINUTES = 60;

const ago = (minutes: number, now: Date) => new Date(now.getTime() - minutes * 60_000);

export async function ipThrottled(ipHash: string | null, now: Date = new Date()): Promise<boolean> {
  if (!ipHash) return false;
  const failures = await db.pinAccessLog.count({
    where: { ipHash, outcome: { notIn: ["SUCCESS", "RATE_LIMITED"] }, createdAt: { gte: ago(IP_WINDOW_MINUTES, now) } },
  });
  return failures >= IP_LIMIT;
}

export async function studentThrottled(studentId: string, now: Date = new Date()): Promise<boolean> {
  const failures = await db.pinAccessLog.count({
    where: { studentId, outcome: { notIn: ["SUCCESS", "RATE_LIMITED"] }, createdAt: { gte: ago(STUDENT_WINDOW_MINUTES, now) } },
  });
  return failures >= STUDENT_LIMIT;
}
