import type { Metadata } from "next";
import type { ReactNode } from "react";
import { signOut } from "@/actions/auth/sign-out";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/require-admin";

// Admin pages always show live data and are never built in advance
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-border bg-linen p-3 md:flex md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:p-6">
        <p className="mb-4 hidden font-display text-lg uppercase tracking-[0.2em] md:block">
          Admin
        </p>
        <AdminNav />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 md:mt-auto md:flex-col md:items-start md:pt-6">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.15em] underline-offset-8 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}