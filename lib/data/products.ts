export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  category: string;
  artist?: string;
  // Whole rupees (PKR) for now. We choose the real database format in Phase 8.
  price: number;
};

// TEMPORARY SAMPLE DATA, replaced by a database query in Phase 10.
// The names come from the project plan. The prices are made up.
export async function getFeaturedProducts(): Promise<ProductSummary[]> {
  return [
    {
      id: "sample-1",
      slug: "whispers-of-lahore",
      name: "Whispers of Lahore",
      category: "Oil Paintings",
      price: 85000,
    },
    {
      id: "sample-2",
      slug: "golden-horizon",
      name: "Golden Horizon",
      category: "Calligraphy",
      price: 62000,
    },
    {
      id: "sample-3",
      slug: "fragments-of-silence",
      name: "Fragments of Silence",
      category: "Sketches",
      price: 28000,
    },
  ];
}