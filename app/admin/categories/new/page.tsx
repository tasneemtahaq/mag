import type { Metadata } from "next";
import { createCategory } from "@/actions/categories/admin-actions";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl font-light">New category</h1>
      <div className="mt-10">
        <CategoryForm action={createCategory} submitLabel="Create category" />
      </div>
    </div>
  );
}