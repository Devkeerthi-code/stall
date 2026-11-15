import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";

/** Server-side gate for owner pages and actions. The user id comes from the signed session cookie only. */
export async function requireOwnerId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return id;
}

export async function currentUser() {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id, email: session.user.email ?? null } : null;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user.email)) redirect("/dashboard");
  return user;
}
