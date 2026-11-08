import nextEnv from "@next/env";
import pg from "pg";
import { existsSync } from "node:fs";

// Load settings exactly the way `npm run dev` does
nextEnv.loadEnvConfig(process.cwd(), true);

console.log("--- 1. The safety switch ---");
const files = [".env.development.local", ".env.local", ".env.development", ".env"];
console.log(
  "Settings files found:",
  files.filter((file) => existsSync(file)).join(", ") || "none",
);
const value = process.env.CHECKOUT_ENABLED;
console.log("CHECKOUT_ENABLED is:", JSON.stringify(value));
console.log(
  value === "true"
    ? "OK: the switch is on."
    : 'PROBLEM: it must be exactly true. Put CHECKOUT_ENABLED="true" in .env.local, then restart.',
);

console.log("\n--- 2. Payment methods ---");
const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  console.log("DIRECT_URL is missing, so I can't check the database.");
  process.exit(0);
}

const client = new pg.Client({ connectionString });
try {
  await client.connect();
  const result = await client.query(
    `select "easypaisaNumber", "jazzcashNumber", "bankName",
            "bankAccountTitle", "bankAccountNumber", "bankIban"
     from "SiteSettings" where id = 'site'`,
  );
  const row = result.rows[0];
  if (!row) {
    console.log("PROBLEM: no settings saved yet. Save your details at /admin/payments.");
  } else {
    const filled = (field) => Boolean(String(row[field] ?? "").trim());
    const easypaisa = filled("easypaisaNumber");
    const jazzcash = filled("jazzcashNumber");
    const bank =
      filled("bankName") &&
      filled("bankAccountTitle") &&
      (filled("bankAccountNumber") || filled("bankIban"));
    console.log("Easypaisa switched on:", easypaisa);
    console.log("JazzCash switched on: ", jazzcash);
    console.log("Bank transfer switched on:", bank);
    console.log(
      easypaisa || jazzcash || bank
        ? "OK: at least one payment method is on."
        : "PROBLEM: none is on. Fill in an account at /admin/payments and save.",
    );
  }
} catch (error) {
  console.log("Could not read the settings:", error.message);
  console.log(
    "If this says a column does not exist, the database update is still pending: run  npx prisma migrate deploy",
  );
} finally {
  await client.end().catch(() => {});
}