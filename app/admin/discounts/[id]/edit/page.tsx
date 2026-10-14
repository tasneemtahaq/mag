import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteDiscount,
  updateDiscount,
} from "@/actions/discounts/discount-actions";
import { DiscountForm } from "@/components/admin/discount-form";
import { Button } from "@/components/ui/button";
import { getAdminDiscount } from "@/lib/data/admin-discounts";
import { rawalpindiDateString } from "@/lib/rawalpindi-time";

export const metadata: Metadata = { title: "Edit discount" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditDiscountPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;

  const discount = await getAdminDiscount(id);
  if (!discount) notFound();

  const used = discount._count.usages;

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/admin/discounts" className="hover:text-foreground">
          Discounts
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-light">{discount.code}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Used {discount.usedCount} time{discount.usedCount === 1 ? "" : "s"}.
        Changes only affect future orders. Past orders keep the discount they
        received.
      </p>

      {error === "used" && (
        <p
          role="alert"
          className="mt-4 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          This code has been used on orders, so it can&rsquo;t be deleted.
          Switch it off instead.
        </p>
      )}

      <div className="mt-10">
        <DiscountForm
          action={updateDiscount.bind(null, discount.id)}
          submitLabel="Save changes"
          initial={{
            code: discount.code,
            description: discount.description ?? "",
            type: discount.type,
            value: discount.value.toString(),
            minOrderAmount: discount.minOrderAmount?.toString() ?? "",
            maxUses: discount.maxUses?.toString() ?? "",
            startsAt: rawalpindiDateString(discount.startsAt),
            endsAt: rawalpindiDateString(discount.endsAt),
            isActive: discount.isActive,
          }}
        />
      </div>

      <section
        aria-labelledby="danger"
        className="mt-16 space-y-4 border-t border-border pt-10"
      >
        <h2 id="danger" className="font-display text-2xl font-light">
          Delete
        </h2>
        <form action={deleteDiscount} className="space-y-4">
          <input type="hidden" name="id" value={discount.id} />
          <p className="text-sm text-muted-foreground">
            {used > 0
              ? "This code has been used on orders, so it can't be deleted. Untick Switched on above to stop it being used."
              : "Deleting is permanent. Customers will no longer be able to use this code."}
          </p>
          {used === 0 && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="confirm"
                required
                className="mt-0.5 size-4 accent-destructive"
              />
              <span>I understand this cannot be undone.</span>
            </label>
          )}
          <Button type="submit" variant="destructive" disabled={used > 0}>
            Delete discount
          </Button>
        </form>
      </section>
    </div>
  );
}