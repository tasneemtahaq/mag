import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth/auth";

// "cache" means the session is looked up once per page, however often it's asked for
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

// For pages that need any signed-in customer
export async function requireUser(returnTo = "/account") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}