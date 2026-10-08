import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/format";

type Client = Prisma.TransactionClient;
type Money = Prisma.Decimal;
const Decimal = Prisma.Decimal;

export type PricedOrder = {
  subtotal: Money;
  discount: {
    id: string;
    code: string;
    amount: Money;
    // The usage count we saw, so a parallel order can't slip past the limit
    seenUsedCount: number;
  } | null;
  discountError: string | null;
  // null until a province is known
  shippingCost: Money | null;
  shippingLabel: string;
  total: Money;
};

const normalise = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

export async function priceOrder(
  client: Client,
  input: {
    lines: { unitPrice: Money; quantity: number }[];
    province: string;
    city: string;
    discountCode: string;
  },
): Promise<PricedOrder> {
  const subtotal = input.lines.reduce(
    (sum, line) => sum.plus(line.unitPrice.mul(line.quantity)),
    new Decimal(0),
  );

  // ----- Discount code -----
  let discount: PricedOrder["discount"] = null;
  let discountError: string | null = null;

  const code = input.discountCode.trim().toUpperCase();
  if (code) {
    const found = await client.discount.findUnique({ where: { code } });
    const now = new Date();

    if (!found || !found.isActive) {
      discountError = "This discount code isn't valid.";
    } else if (found.startsAt && found.startsAt > now) {
      discountError = "This discount code isn't active yet.";
    } else if (found.endsAt && found.endsAt < now) {
      discountError = "This discount code has expired.";
    } else if (found.maxUses !== null && found.usedCount >= found.maxUses) {
      discountError = "This discount code has reached its usage limit.";
    } else if (found.minOrderAmount && subtotal.lt(found.minOrderAmount)) {
      discountError = `This code needs an order of at least ${formatPrice(found.minOrderAmount.toNumber())}.`;
    } else {
      const raw =
        found.type === "PERCENTAGE"
          ? subtotal.mul(found.value).div(100)
          : found.value;
      // A discount can never be more than the artwork itself
      const amount = Decimal.min(raw.toDecimalPlaces(2), subtotal);
      discount = {
        id: found.id,
        code: found.code,
        amount,
        seenUsedCount: found.usedCount,
      };
    }
  }

  const merchandise = subtotal.minus(discount?.amount ?? 0);

  // ----- Delivery -----
  const province = normalise(input.province);
  if (!province) {
    return {
      subtotal,
      discount,
      discountError,
      shippingCost: null,
      shippingLabel: "Calculated once you choose your province",
      total: merchandise,
    };
  }

  const [settings, rules] = await Promise.all([
    client.siteSettings.findUnique({ where: { id: "site" } }),
    client.shippingRule.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const city = normalise(input.city);
  // The most specific rule wins: city, then province, then a general rule
  const rule =
    rules.find(
      (item) =>
        item.city &&
        normalise(item.city) === city &&
        (!item.province || normalise(item.province) === province),
    ) ??
    rules.find(
      (item) =>
        !item.city && item.province && normalise(item.province) === province,
    ) ??
    rules.find((item) => !item.city && !item.province);

  const rate = rule ? rule.rate : (settings?.flatShippingRate ?? new Decimal(0));
  const freeAbove = rule
    ? (rule.freeAbove ?? settings?.freeShippingThreshold ?? null)
    : (settings?.freeShippingThreshold ?? null);

  const free = freeAbove !== null && merchandise.gte(freeAbove);
  const shippingCost = free ? new Decimal(0) : rate;

  return {
    subtotal,
    discount,
    discountError,
    shippingCost,
    shippingLabel: free
      ? "Free delivery"
      : rule
        ? rule.name
        : "Standard delivery",
    total: merchandise.plus(shippingCost),
  };
}