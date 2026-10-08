"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { placeOrder, quoteCheckout } from "@/actions/checkout/checkout-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROVINCES } from "@/lib/checkout/provinces";
import type { Quote } from "@/lib/checkout/types";
import { formatPrice } from "@/lib/format";

export type SummaryLine = {
  id: string;
  name: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
};

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
};

type Values = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  saveAddress: boolean;
};

type TextField = Exclude<keyof Values, "saveAddress">;

const controlClass =
  "flex h-10 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const legendClass =
  "mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground";

export function CheckoutForm({
  lines,
  subtotal,
  signedIn,
  initial,
  addresses,
}: {
  lines: SummaryLine[];
  subtotal: number;
  signedIn: boolean;
  initial: { name: string; email: string };
  addresses: SavedAddress[];
}) {
  // Start from the customer's default saved address, if there is one
  const first = addresses[0];
  const [values, setValues] = useState<Values>({
    name: first?.fullName ?? initial.name,
    email: initial.email,
    phone: first?.phone ?? "",
    line1: first?.line1 ?? "",
    line2: first?.line2 ?? "",
    city: first?.city ?? "",
    province: first?.province ?? "",
    postalCode: first?.postalCode ?? "",
    notes: "",
    saveAddress: signedIn && addresses.length === 0,
  });

  const [initialQuote] = useState<Quote>({
    subtotal,
    shippingCost: null,
    shippingLabel: "Calculated once you choose your province",
    discountTotal: 0,
    discountCode: null,
    total: subtotal,
  });
  const [quote, setQuote] = useState<Quote>(initialQuote);

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [quoteProblem, setQuoteProblem] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Ask the server for the delivery cost and discount whenever they could change.
  // (The server always works out the real amounts again when the order is placed.)
  useEffect(() => {
    if (!values.province && !appliedCode) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      quoteCheckout({
        province: values.province,
        city: values.city,
        discountCode: appliedCode,
      })
        .then((result) => {
          if (cancelled) return;
          if (result.ok) {
            setQuote(result.quote);
            setDiscountError(result.discountError);
            setQuoteProblem(null);
          } else {
            setQuoteProblem(result.message);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setQuoteProblem("We couldn't update the delivery cost. Please try again.");
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [values.province, values.city, appliedCode]);

  function set(name: keyof Values, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function fillFromSaved(id: string) {
    const address = addresses.find((item) => item.id === id);
    if (!address) return;
    setValues((current) => ({
      ...current,
      name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      province: address.province,
      postalCode: address.postalCode ?? "",
      saveAddress: false,
    }));
    setErrors({});
  }

  function applyCode() {
    setDiscountError(null);
    setAppliedCode(codeInput.trim());
  }

  function removeCode() {
    setCodeInput("");
    setAppliedCode("");
    setDiscountError(null);
    // With a province chosen, the effect above fetches fresh totals
    if (!values.province) setQuote(initialQuote);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);

    startTransition(async () => {
      const result = await placeOrder({ ...values, discountCode: appliedCode });
      // On success the server sends the visitor to the confirmation page
      if (result && !result.ok) {
        setErrors(result.errors ?? {});
        setMessage(result.message);
      }
    });
  }

  const text = (
    name: TextField,
    label: string,
    options: {
      type?: string;
      autoComplete?: string;
      inputMode?: "text" | "numeric" | "tel" | "email";
      hint?: string;
      required?: boolean;
    } = {},
  ) => (
    <Field
      id={`co-${name}`}
      label={label}
      error={errors[name]}
      hint={options.hint}
    >
      <Input
        id={`co-${name}`}
        name={name}
        type={options.type ?? "text"}
        autoComplete={options.autoComplete}
        inputMode={options.inputMode}
        required={options.required}
        value={values[name]}
        onChange={(event) => set(name, event.target.value)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `co-${name}-error` : undefined}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-5">
      <div className="space-y-12 lg:col-span-3">
        {addresses.length > 0 && (
          <div>
            <Label htmlFor="co-saved">Use a saved address</Label>
            <select
              id="co-saved"
              defaultValue={first?.id}
              onChange={(event) => fillFromSaved(event.target.value)}
              className={`${controlClass} mt-2`}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.fullName}, {address.line1}, {address.city}
                </option>
              ))}
              <option value="">Enter a new address below</option>
            </select>
          </div>
        )}

        <fieldset className="space-y-6">
          <legend className={legendClass}>Contact</legend>
          {text("name", "Full name", { autoComplete: "name", required: true })}
          <div className="grid gap-6 sm:grid-cols-2">
            {text("email", "Email", {
              type: "email",
              autoComplete: "email",
              required: true,
              hint: "We use it to send you updates about your order.",
            })}
            {text("phone", "Phone", {
              type: "tel",
              autoComplete: "tel",
              inputMode: "tel",
              required: true,
              hint: "For example 0300 1234567",
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-6">
          <legend className={legendClass}>Delivery address</legend>
          {text("line1", "Street address", {
            autoComplete: "address-line1",
            required: true,
          })}
          {text("line2", "Apartment, area or landmark (optional)", {
            autoComplete: "address-line2",
          })}
          <div className="grid gap-6 sm:grid-cols-2">
            {text("city", "City", {
              autoComplete: "address-level2",
              required: true,
            })}
            <Field id="co-province" label="Province" error={errors.province}>
              <select
                id="co-province"
                name="province"
                autoComplete="address-level1"
                required
                value={values.province}
                onChange={(event) => set("province", event.target.value)}
                aria-invalid={errors.province ? true : undefined}
                aria-describedby={errors.province ? "co-province-error" : undefined}
                className={controlClass}
              >
                <option value="">Choose your province</option>
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {text("postalCode", "Postal code (optional)", {
              autoComplete: "postal-code",
              inputMode: "numeric",
            })}
            <div>
              <p className="text-sm font-medium">Country</p>
              <p className="mt-4 text-sm text-muted-foreground">Pakistan</p>
            </div>
          </div>
          {signedIn && (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={values.saveAddress}
                onChange={(event) => set("saveAddress", event.target.checked)}
                className="size-4 accent-gold-deep"
              />
              Save this address for next time
            </label>
          )}
        </fieldset>

        <fieldset className="space-y-6">
          <legend className={legendClass}>Note (optional)</legend>
          <Field id="co-notes" label="Anything we should know?" error={errors.notes}>
            <Textarea
              id="co-notes"
              name="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className={legendClass}>Payment</legend>
          <div className="border border-ink p-4">
            <p className="text-sm font-medium">Cash on delivery</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay when your artwork arrives. The gallery will contact you to
              confirm your order and arrange delivery. Online payment options
              are coming soon.
            </p>
          </div>
        </fieldset>
      </div>

      <aside className="lg:col-span-2">
        <div className="space-y-6 border border-border p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-light">Your order</h2>

          <ul className="divide-y divide-border border-y border-border">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-4 py-4">
                <div className="relative size-16 shrink-0 bg-linen">
                  {line.imageUrl && (
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain p-0.5"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{line.name}</p>
                  {line.variantName !== "Standard" && (
                    <p className="text-muted-foreground">{line.variantName}</p>
                  )}
                  <p className="text-muted-foreground">Qty {line.quantity}</p>
                </div>
                <p className="text-sm">{formatPrice(line.lineTotal)}</p>
              </li>
            ))}
          </ul>

          {/* Discount code */}
          <div>
            <Label htmlFor="co-code">Discount code</Label>
            {quote.discountCode ? (
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <p>
                  <span className="font-medium">{quote.discountCode}</span> applied
                </p>
                <button
                  type="button"
                  onClick={removeCode}
                  className="text-xs underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  id="co-code"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyCode();
                    }
                  }}
                  autoComplete="off"
                />
                <Button type="button" variant="outline" onClick={applyCode}>
                  Apply
                </Button>
              </div>
            )}
            {discountError && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {discountError}
              </p>
            )}
          </div>

          <dl className="space-y-3 text-sm" aria-live="polite">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(quote.subtotal)}</dd>
            </div>
            {quote.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="text-gold-deep">
                  −{formatPrice(quote.discountTotal)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Delivery
                <span className="block text-xs">{quote.shippingLabel}</span>
              </dt>
              <dd>
                {quote.shippingCost === null
                  ? "—"
                  : quote.shippingCost === 0
                    ? "Free"
                    : formatPrice(quote.shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-4 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(quote.total)}</dd>
            </div>
          </dl>

          {quoteProblem && (
            <p role="alert" className="text-sm text-destructive">
              {quoteProblem}
            </p>
          )}
          {message && (
            <p
              role="alert"
              className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {message}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Placing your order…" : "Place order"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You pay on delivery. You can&rsquo;t be charged online.
          </p>
        </div>
      </aside>
    </form>
  );
}