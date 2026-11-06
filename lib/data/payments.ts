import "server-only";
import { db } from "@/lib/db/prisma";
import { paymentProviderLabel } from "@/lib/order-labels";
import type { PaymentMethod } from "@/lib/payments/methods";

export type PaymentInstructions = {
  method: PaymentMethod;
  label: string;
  rows: { label: string; value: string }[];
};

const clean = (value: string | null | undefined) => (value ?? "").trim();

function rows(pairs: [string, string | null | undefined][]) {
  return pairs
    .map(([label, value]) => ({ label, value: clean(value) }))
    .filter((row) => row.value !== "");
}

// A method is on when its account details have been filled in on the admin's Payments page
export async function getEnabledPaymentMethods() {
  const settings = await db.siteSettings.findUnique({ where: { id: "site" } });
  const methods: PaymentInstructions[] = [];

  if (settings) {
    if (clean(settings.easypaisaNumber)) {
      methods.push({
        method: "easypaisa",
        label: paymentProviderLabel("easypaisa"),
        rows: rows([
          ["Account title", settings.easypaisaTitle],
          ["Mobile account number", settings.easypaisaNumber],
        ]),
      });
    }
    if (clean(settings.jazzcashNumber)) {
      methods.push({
        method: "jazzcash",
        label: paymentProviderLabel("jazzcash"),
        rows: rows([
          ["Account title", settings.jazzcashTitle],
          ["Mobile account number", settings.jazzcashNumber],
        ]),
      });
    }
    if (
      clean(settings.bankName) &&
      clean(settings.bankAccountTitle) &&
      (clean(settings.bankAccountNumber) || clean(settings.bankIban))
    ) {
      methods.push({
        method: "bank_transfer",
        label: paymentProviderLabel("bank_transfer"),
        rows: rows([
          ["Bank", settings.bankName],
          ["Account title", settings.bankAccountTitle],
          ["Account number", settings.bankAccountNumber],
          ["IBAN", settings.bankIban],
          ["Branch", settings.bankBranch],
        ]),
      });
    }
  }

  return { methods, note: clean(settings?.paymentNote) || null };
}