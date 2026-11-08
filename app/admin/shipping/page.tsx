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
import { CM_PER_INCH, deliveryForItem, sizeShippingFrom } from "@/lib/checkout/delivery";
import { priceOrder } from "@/lib/checkout/pricing";
import { PROVINCES } from "@/lib/checkout/provinces";
import { getShippingAdmin } from "@/lib/data/admin-catalog";
import { db } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping" };

const notices: Record<string, string> = {
  "settings-saved": "Delivery settings saved.",
  "rule-added": "Special rule added.",
  "rule-saved": "Special rule saved.",
  "rule-deleted": "Special rule deleted.",
};

const problems: Record<string, string> = {
  "invalid-settings":
    "Please check the numbers. Sizes are in inches (for example 36 or 2.5), and prices are in rupees (for example 1500). The free-delivery amount can be left blank.",
  "invalid-rule":
    "Please give the rule a name and enter its amounts in rupees, like 500. The order must be a whole number.",
};

const selectClass =
  "mt-2 flex h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

// Common frame sizes (height × width, in inches) for the price table
const EXAMPLE_SIZES: [number, number][] = [
  [18, 12],
  [24, 18],
  [36, 24],
  [40, 30],
  [48, 36],
  [60, 48],
];

function NumberField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        inputMode="decimal"
        defaultValue={defaultValue}
        className="mt-2"
      />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

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
          <Label htmlFor={`${prefix}-rate`}>Fixed delivery cost (PKR)</Label>
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
    testHeight?: string;
    testWidth?: string;
    testThickness?: string;
  }>;
};

export default async function AdminShippingPage({ searchParams }: Props) {
  const query = await searchParams;
  const { notice, error, testProvince, testCity, testAmount } = query;
  const { settings, rules } = await getShippingAdmin();
  const sizeSettings = sizeShippingFrom(settings);

  const refHeight = sizeSettings.refHeightIn.toString();
  const refWidth = sizeSettings.refWidthIn.toString();
  const refThickness = sizeSettings.refThicknessIn.toString();

  // "Check a delivery price" uses the very same function as checkout
  let test: { label: string; cost: number | null } | null = null;
  const amount = Number(testAmount);
  const height = Number(query.testHeight ?? refHeight);
  const width = Number(query.testWidth ?? refWidth);
  const thickness = Number(query.testThickness ?? refThickness);
  if (
    testProvince &&
    [amount, height, width, thickness].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    const toCm = (inches: number) => new Prisma.Decimal(inches).mul(CM_PER_INCH);
    const priced = await priceOrder(db, {
      lines: [
        {
          unitPrice: new Prisma.Decimal(amount),
          quantity: 1,
          heightCm: toCm(height),
          widthCm: toCm(width),
          depthCm: toCm(thickness),
        },
      ],
      province: testProvince,
      city: testCity ?? "",
      discountCode: "",
    });
    test = {
      label: priced.shippingLabel,
      cost: priced.shippingCost?.toNumber() ?? null,
    };
  }

  const ignoredGeneralRules = rules.filter(
    (rule) => rule.isActive && !rule.city && !rule.province,
  );
  const overridingRules = rules.filter(
    (rule) => rule.isActive && (rule.city || rule.province),
  );

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Shipping</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Delivery cost is worked out at checkout from the size of each artwork
        and the customer&rsquo;s city.
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

      <section aria-labelledby="by-size" className="mt-12">
        <h2 id="by-size" className="font-display text-2xl font-light">
          Delivery by frame size
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Describe one reference frame and what it costs to send anywhere in
          Pakistan outside Rawalpindi. Every other size is priced in proportion
          to its volume (height × width × thickness), rounded up to the next
          Rs 50. Each artwork is sent as its own parcel.
        </p>
        <form
          action={saveShippingSettings}
          className="mt-4 space-y-5 border border-border p-4"
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <NumberField
              name="shipRefHeightIn"
              label="Reference height (in)"
              defaultValue={refHeight}
            />
            <NumberField
              name="shipRefWidthIn"
              label="Reference width (in)"
              defaultValue={refWidth}
            />
            <NumberField
              name="shipRefThicknessIn"
              label="Reference thickness (in)"
              defaultValue={refThickness}
            />
            <NumberField
              name="shipRefPrice"
              label="Reference price (PKR)"
              defaultValue={sizeSettings.refPrice.toString()}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              name="shipMinPerItem"
              label="Minimum per artwork (PKR)"
              defaultValue={sizeSettings.minPerItem.toString()}
              hint="The least charged for one artwork, however small."
            />
            <NumberField
              name="localDeliveryRate"
              label="Rawalpindi delivery (PKR)"
              defaultValue={settings?.localDeliveryRate.toString() ?? "0"}
              hint="Charged per order when the city is Rawalpindi. 0 means free."
            />
            <NumberField
              name="freeShippingThreshold"
              label="Free delivery above (PKR, optional)"
              defaultValue={settings?.freeShippingThreshold?.toString() ?? ""}
              hint="Measured on the artwork total after any discount. Applies everywhere."
            />
          </div>
          <Button type="submit">Save</Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Artwork sizes come from each variant (width, height and depth, in
          centimetres). Depth is the frame&rsquo;s thickness. For your
          reference frame, enter 91.44, 60.96 and 7.62. A variant with no size
          is treated as the reference frame.
        </p>
      </section>

      <section aria-labelledby="table" className="mt-12">
        <h2 id="table" className="font-display text-2xl font-light">
          What customers pay per artwork
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Outside Rawalpindi, at the reference thickness of {refThickness} in.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.15em] text-muted-foreground">
                <th className="py-2 pr-6 font-medium">Height × width</th>
                <th className="py-2 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_SIZES.map(([h, w]) => {
                const cost = deliveryForItem(
                  {
                    heightIn: new Prisma.Decimal(h),
                    widthIn: new Prisma.Decimal(w),
                    thicknessIn: sizeSettings.refThicknessIn,
                  },
                  sizeSettings,
                );
                return (
                  <tr key={`${h}-${w}`} className="border-b border-border">
                    <td className="py-2 pr-6">
                      {h} × {w} in
                    </td>
                    <td className="py-2">{formatPrice(cost.toNumber())}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="rules" className="mt-14">
        <h2 id="rules" className="font-display text-2xl font-light">
          Special rules (optional)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A rule for a city or a province replaces the size pricing with a
          fixed cost for orders to that place. A city rule wins over a province
          rule. Leave this empty if size pricing should apply everywhere.
        </p>

        {overridingRules.length > 0 && (
          <p className="mt-4 border border-border bg-muted px-4 py-3 text-sm">
            {overridingRules.length === 1
              ? "1 rule is switched on, so it replaces size pricing for its place."
              : `${overridingRules.length} rules are switched on, so they replace size pricing for their places.`}{" "}
            Delete the ones you were only testing with.
          </p>
        )}
        {ignoredGeneralRules.length > 0 && (
          <p className="mt-4 border border-border bg-muted px-4 py-3 text-sm">
            {ignoredGeneralRules.length} rule
            {ignoredGeneralRules.length === 1 ? " has" : "s have"} no province
            and no city. These are no longer used, so you can delete them.
          </p>
        )}

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
              No special rules. Every order uses size pricing.
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
          Try one artwork&rsquo;s size and an address. This uses exactly what
          checkout uses.
        </p>
        <form
          action="/admin/shipping"
          method="get"
          className="mt-4 grid gap-4 border border-border p-4 sm:grid-cols-3"
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
            <Label htmlFor="testAmount">Artwork price (PKR)</Label>
            <Input
              id="testAmount"
              name="testAmount"
              inputMode="decimal"
              defaultValue={testAmount ?? ""}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="testHeight">Height (in)</Label>
            <Input
              id="testHeight"
              name="testHeight"
              inputMode="decimal"
              defaultValue={query.testHeight ?? refHeight}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="testWidth">Width (in)</Label>
            <Input
              id="testWidth"
              name="testWidth"
              inputMode="decimal"
              defaultValue={query.testWidth ?? refWidth}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="testThickness">Thickness (in)</Label>
            <Input
              id="testThickness"
              name="testThickness"
              inputMode="decimal"
              defaultValue={query.testThickness ?? refThickness}
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-3">
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