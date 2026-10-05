import "server-only";
import { notFound } from "next/navigation";

// TEMPORARY, until the real login system in Phase 12.
// The admin area only works while you run "npm run dev" on your own computer.
// Anywhere else (a deployed site, "npm run start") it answers "404 not found".
// Every admin page and Server Action calls this function, so in Phase 12 we
// only need to replace what happens inside it.
export async function requireAdmin() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return { id: "dev-admin", role: "ADMIN" as const };
}