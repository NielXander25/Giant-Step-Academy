import { redirect } from "next/navigation";
import { homePathFor, requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Sends each signed-in user to the area that matches their role. */
export default async function DashboardRedirect() {
  const user = await requireUser();
  redirect(homePathFor(user.role));
}
