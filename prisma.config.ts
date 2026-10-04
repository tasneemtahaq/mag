import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js keeps secrets in .env.local, so the Prisma tool reads that file too
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // What "npx prisma db seed" runs
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The Prisma tool (migrations) uses the DIRECT connection
    url: env("DIRECT_URL"),
  },
});