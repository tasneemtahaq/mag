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