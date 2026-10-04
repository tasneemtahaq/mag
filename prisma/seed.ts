import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({ path: ".env.local" });

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL is missing. Check your .env.local file.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Sizes are managed by the admin later. These are only a starting set.
const sizes = [
  { name: "Small", widthCm: 30, heightCm: 40 },
  { name: "Medium", widthCm: 45, heightCm: 60 },
  { name: "Large", widthCm: 60, heightCm: 90 },
  { name: "Extra Large", widthCm: 90, heightCm: 120 },
  { name: "12 × 18 in", widthCm: 30.48, heightCm: 45.72 },
  { name: "18 × 24 in", widthCm: 45.72, heightCm: 60.96 },
  { name: "24 × 36 in", widthCm: 60.96, heightCm: 91.44 },
];

// Your initial 10 categories. The admin can rename, reorder or add more.
const categories = [
  { name: "Oil Paintings", subs: ["Landscape", "Portrait", "Abstract"] },
  { name: "Prints", subs: ["Giclée", "Limited Edition"] },
  { name: "Sketches", subs: [] },
  { name: "Calligraphy", subs: ["Arabic", "Urdu"] },
  { name: "Metallics", subs: [] },
  { name: "Fiber Work", subs: [] },
  { name: "Resin Work", subs: [] },
  { name: "Carpets", subs: [] },
  { name: "Mixed Media", subs: [] },
  { name: "Sculptures", subs: [] },
];

async function main() {
  await db.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: { id: "site" },
  });

  for (const [index, size] of sizes.entries()) {
    await db.size.upsert({
      where: { slug: slugify(size.name) },
      update: {},
      create: { ...size, slug: slugify(size.name), sortOrder: index },
    });
  }

  for (const [index, entry] of categories.entries()) {
    const slug = slugify(entry.name);
    const category = await db.category.upsert({
      where: { slug },
      update: {},
      create: { name: entry.name, slug, sortOrder: index },
    });

    for (const [subIndex, subName] of entry.subs.entries()) {
      const subSlug = slugify(subName);
      await db.subcategory.upsert({
        where: {
          categoryId_slug: { categoryId: category.id, slug: subSlug },
        },
        update: {},
        create: {
          categoryId: category.id,
          name: subName,
          slug: subSlug,
          sortOrder: subIndex,
        },
      });
    }
  }

  const [categoryCount, subcategoryCount, sizeCount] = await Promise.all([
    db.category.count(),
    db.subcategory.count(),
    db.size.count(),
  ]);
  console.log(
    `Seed complete: ${categoryCount} categories, ${subcategoryCount} subcategories, ${sizeCount} sizes.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());