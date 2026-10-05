import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  await requireAdmin();

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-border bg-linen p-3 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-6">
        <p className="mb-4 hidden font-display text-lg uppercase tracking-[0.2em] md:block">
          Admin
        </p>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">
        <p className="bg-gold/15 px-6 py-2 text-xs text-ink/80">
          Development mode: the admin area only works on your own computer until
          login is built.
        </p>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}