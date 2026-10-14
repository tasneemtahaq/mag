import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { setDiscountActive } from "@/actions/discounts/discount-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminDiscounts } from "@/lib/data/admin-discounts";
import { formatPrice } from "@/lib/format";
import { rawalpindiDateString } from "@/lib/rawalpindi-time";

export const metadata: Metadata = { title: "Discounts" };

const small = buttonVariants({ variant: "outline", size: "sm" });

type Discount = Awaited<ReturnType<typeof getAdminDiscounts>>[number];

function statusOf(discount: Discount, now: Date) {
  if (!discount.isActive) return { label: "Off", active: false };
  if (discount.startsAt && discount.startsAt > now) {
    return { label: "Scheduled", active: false };
  }
  if (discount.endsAt && discount.endsAt < now) {
    return { label: "Expired", active: false };
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return { label: "Used up", active: false };
  }
  return { label: "Active", active: true };
}

export default async function AdminDiscountsPage() {
  const discounts = await getAdminDiscounts();
  const now = new Date();

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-light">Discounts</h1>
        <Link href="/admin/discounts/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New discount
        </Link>
      </div>

      <div className="mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => {
              const status = statusOf(discount, now);
              const conditions = [
                discount.minOrderAmount
                  ? `Min ${formatPrice(discount.minOrderAmount.toNumber())}`
                  : null,
                discount.startsAt
                  ? `From ${rawalpindiDateString(discount.startsAt)}`
                  : null,
                discount.endsAt
                  ? `Until ${rawalpindiDateString(discount.endsAt)}`
                  : null,
              ].filter(Boolean);

              return (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/discounts/${discount.id}/edit`}
                      className="hover:underline"
                    >
                      {discount.code}
                    </Link>
                    {discount.description && (
                      <p className="text-xs font-normal text-muted-foreground">
                        {discount.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {discount.type === "PERCENTAGE"
                      ? `${Number(discount.value)}% off`
                      : `${formatPrice(discount.value.toNumber())} off`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {conditions.length > 0 ? conditions.join(" · ") : "None"}
                  </TableCell>
                  <TableCell className="text-right">
                    {discount.usedCount}
                    {discount.maxUses !== null ? ` / ${discount.maxUses}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.active ? "secondary" : "outline"}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <form action={setDiscountActive}>
                        <input type="hidden" name="id" value={discount.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={String(!discount.isActive)}
                        />
                        <button type="submit" className={small}>
                          {discount.isActive ? "Switch off" : "Switch on"}
                        </button>
                      </form>
                      <Link
                        href={`/admin/discounts/${discount.id}/edit`}
                        className={small}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {discounts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No discount codes yet. Create the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}