import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Check your .env.local file.");
  }
  // The website uses the pooled connection
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// In development, Next.js reloads code often. Keeping one client on a global
// object stops it from opening a new connection every time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}