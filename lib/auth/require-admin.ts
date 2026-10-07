import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

// The single lock on the admin area.
// Not signed in -> sent to the login page.
// Signed in but not an admin -> a 404, as if the page didn't exist.
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") notFound();
  return user;
}