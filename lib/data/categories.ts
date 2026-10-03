export type NavCategory = {
  name: string;
  slug: string;
};

// TEMPORARY STAND-IN.
// In Phase 9 this will query the database for enabled categories.
// The footer already calls this function, so nothing else will need to change.
export async function getFooterCategories(): Promise<NavCategory[]> {
  return [];
}
// TEMPORARY SAMPLE DATA, replaced by a database query in Phase 9.
export async function getHomeCategories(): Promise<NavCategory[]> {
  return [
    { name: "Oil Paintings", slug: "oil-paintings" },
    { name: "Prints", slug: "prints" },
    { name: "Sketches", slug: "sketches" },
    { name: "Calligraphy", slug: "calligraphy" },
    { name: "Carpets", slug: "carpets" },
    { name: "Fibre-Work", slug: "fibre-work" },
  ];
}