import type { Metadata } from "next";
import { createDiscount } from "@/actions/discounts/discount-actions";
import { DiscountForm } from "@/components/admin/discount-form";

export const metadata: Metadata = { title: "New discount" };

export default function NewDiscountPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-light">New discount</h1>
      <div className="mt-10">
        <DiscountForm action={createDiscount} submitLabel="Create discount" />
      </div>
    </div>
  );
}