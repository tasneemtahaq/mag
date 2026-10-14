import type { Metadata } from "next";
import { Prisma } from "@/generated/prisma/client";
import {
  createShippingRule,
  deleteShippingRule,
  saveShippingSettings,
  updateShippingRule,
} from "@/actions/catalog/shipping-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { priceOrder } from "@/lib/checkout/pricing";
import { PROVINCES } from "@/lib/checkout/provinces";
import { getShippingAdmin } from "@/lib/data/admin-catalog";
import { db } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping" };

const notices: Record<string, string> = {
  "settings-saved": "Delivery settings saved.",
  "rule-added": "Delivery rule added.",
  "rule-saved": "Delivery rule saved.",
  "rule-deleted": "Delivery rule deleted.",
};

const problems: Record<string, string> = {
  "invalid-settings":
    "Please enter amounts in rupees, like 500 or 500.50. The free-delivery amount can be left blank.",
  "invalid-rule":
    "Please give the rule a name and enter its amounts in rupees, like 500. The order must be a whole number.",
};

const selectClass =
  "mt-2 flex h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type RuleValues = {
  name: string;
  province: string | null;
  city: string | null;
  rate: { toString(): string };
  freeAbove: { toString(): string } | null;
  sortOrder: number;
};

function RuleFields({ prefix, rule }: { prefix: string; rule?: RuleValues }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${prefix}-name`}>Name</Label>
          <Input
            id={`${prefix}-name`}
            name="name"
            defaultValue={rule?.name ?? ""}
            placeholder="For example Karachi delivery"
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-province`}>Province</Label>
          <select
            id={`${prefix}-province`}
            name="province"
            defaultValue={rule?.province ?? ""}
            className={selectClass}
          >
            <option value="">Any province</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`${prefix}-city`}>City (optional)</Label>
          <Input
            id={`${prefix}-city`}
            name="city"
            defaultValue={rule?.city ?? ""}
            className="mt-2"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${prefix}-rate`}>Delivery cost (PKR)</Label>
          <Input
            id={`${prefix}-rate`}
            name="rate"
            inputMode="decimal"
            defaultValue={rule?.rate.toString() ?? ""}
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-free`}>Free above (PKR, optional)</Label>
          <Input
            id={`${prefix}-free`}
            name="freeAbove"
            inputMode="decimal"
            defaultValue={rule?.freeAbove?.toString() ?? ""}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-order`}>Order</Label>
          <Input
            id={`${prefix}-order`}
            name="sortOrder"
            inputMode="numeric"
            defaultValue={String(rule?.sortOrder ?? 0)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

type Props = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    testProvince?: string;
    testCity?: string;
    testAmount?: string;
  }>;
};

export default async function AdminShippingPage({ searchParams }: Props) {
  const { notice, error, testProvince, testCity, testAmount } =
    await searchParams;
  const { settings, rules } = await getShippingAdmin();

  // "Check a delivery price" uses the very same function as checkout
  let test: { label: string; cost: number | null } | null = null;
  const amount = Number(testAmount);
  if (testProvince && Number.isFinite(amount) && amount > 0) {
    const priced = await priceOrder(db, {
      lines: [{ unitPrice: new Prisma.Decimal(amount), quantity: 1 }],
      province: testProvince,
      city: testCity ?? "",
      discountCode: "",
    });
    test = {
      label: priced.shippingLabel,
      cost: priced.shippingCost?.toNumber() ?? null,
    };
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Shipping</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Delivery cost is worked out at checkout from the customer&rsquo;s city
        and province.
      </p>

      {notice && notices[notice] && (
        <p role="status" className="mt-6 border border-border bg-muted px-4 py-3 text-sm">
          {notices[notice]}
        </p>
      )}
      {error && problems[error] && (
        <p
          role="alert"
          className="mt-6 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {problems[error]}
        </p>
      )}

      <section aria-labelledby="standard" className="mt-12">
        <h2 id="standard" className="font-display text-2xl font-light">
          Standard delivery
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Used when no delivery rule below matches.
        </p>
        <form
          action={saveShippingSettings}
          className="mt-4 space-y-4 border border-border p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="flatShippingRate">Delivery cost (PKR)</Label>
              <Input
                id="flatShippingRate"
                name="flatShippingRate"
                inputMode="decimal"
                defaultValue={settings?.flatShippingRate.toString() ?? "0"}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="freeShippingThreshold">
                Free delivery above (PKR, optional)
              </Label>
              <Input
                id="freeShippingThreshold"
                name="freeShippingThreshold"
                inputMode="decimal"
                defaultValue={settings?.freeShippingThreshold?.toString() ?? ""}
                className="mt-2"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Measured on the artwork total after any discount.
              </p>
            </div>
          </div>
          <Button type="submit">Save</Button>
        </form>
      </section>

      <section aria-labelledby="rules" className="mt-14">
        <h2 id="rules" className="font-display text-2xl font-light">
          Delivery rules
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The most specific rule wins: a city rule first, then a province rule,
          then a rule with no province or city. If two rules are equally
          specific, the one with the lower order number is used.
        </p>

        <div className="mt-4 space-y-4">
          {rules.map((rule) => (
            <form
              key={rule.id}
              action={updateShippingRule}
              className="space-y-4 border border-border p-4"
            >
              <input type="hidden" name="id" value={rule.id} />
              <RuleFields prefix={rule.id} rule={rule} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={rule.isActive}
                    className="size-4 accent-gold-deep"
                  />
                  Switched on
                </label>
                <div className="flex gap-3">
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    formAction={deleteShippingRule}
                    formNoValidate
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </form>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No rules yet. Every order uses the standard delivery above.
            </p>
          )}

          <form
            action={createShippingRule}
            className="space-y-4 border border-dashed border-border p-4"
          >
            <p className="text-sm font-medium">Add a rule</p>
            <RuleFields prefix="new-rule" />
            <Button type="submit">Add rule</Button>
          </form>
        </div>
      </section>

      <section aria-labelledby="check" className="mt-14">
        <h2 id="check" className="font-display text-2xl font-light">
          Check a delivery price
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try an address and an artwork total to see what a customer would pay.
        </p>
        <form
          action="/admin/shipping"
          method="get"
          className="mt-4 grid gap-4 border border-border p-4 sm:grid-cols-4"
        >
          <div>
            <Label htmlFor="testProvince">Province</Label>
            <select
              id="testProvince"
              name="testProvince"
              defaultValue={testProvince ?? ""}
              required
              className={selectClass}
            >
              <option value="">Choose</option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="testCity">City</Label>
            <Input
              id="testCity"
              name="testCity"
              defaultValue={testCity ?? ""}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="testAmount">Artwork total (PKR)</Label>
            <Input
              id="testAmount"
              name="testAmount"
              inputMode="decimal"
              defaultValue={testAmount ?? ""}
              required
              className="mt-2"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Check
            </Button>
          </div>
        </form>
        {test && (
          <p role="status" className="mt-4 text-sm">
            Delivery:{" "}
            <span className="font-medium">
              {test.cost === null
                ? "—"
                : test.cost === 0
                  ? "Free"
                  : formatPrice(test.cost)}
            </span>{" "}
            <span className="text-muted-foreground">({test.label})</span>
          </p>
        )}
      </section>
    </div>
  );
}