import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverview } from "@/lib/data/admin-categories";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();

  const cards = [
    { label: "Active categories", value: overview.active, href: "/admin/categories" },
    { label: "Disabled categories", value: overview.disabled, href: "/admin/categories" },
    { label: "Archived categories", value: overview.archived, href: "/admin/categories" },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Dashboard</h1>
      <p className="mt-3 text-muted-foreground">
        Products, orders and customers arrive in later phases.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block border border-border p-6 transition-colors hover:bg-accent/50"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-3 font-display text-5xl font-light">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}