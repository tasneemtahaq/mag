import type { Metadata } from "next";
import Link from "next/link";
import { savePaymentSettings } from "@/actions/catalog/payment-settings-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPaymentQueues,
  getPaymentSettings,
} from "@/lib/data/admin-payments";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { paymentProviderLabel } from "@/lib/order-labels";

export const metadata: Metadata = { title: "Payments" };

type Props = { searchParams: Promise<{ notice?: string; error?: string }> };

function Field({
  name,
  label,
  defaultValue,
  hint,
  inputMode,
}: {
  name: string;
  label: string;
  defaultValue: string | null | undefined;
  hint?: string;
  inputMode?: "text" | "numeric" | "tel";
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        inputMode={inputMode}
        autoComplete="off"
        className="mt-2"
      />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function OrderList({
  title,
  empty,
  orders,
}: {
  title: string;
  empty: string;
  orders: Awaited<ReturnType<typeof getPaymentQueues>>["toCheck"];
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-light">{title}</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-medium hover:underline"
                >
                  {formatOrderNumber(order.number)}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {order.customerName} · {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{formatPrice(order.total.toNumber())}</span>
                {order.payments[0] && (
                  <Badge variant="outline">
                    {paymentProviderLabel(order.payments[0].provider)}
                  </Badge>
                )}
                <Link
                  href={`/admin/orders/${order.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { notice, error } = await searchParams;
  const [settings, queues] = await Promise.all([
    getPaymentSettings(),
    getPaymentQueues(),
  ]);

  const on = {
    easypaisa: Boolean(settings?.easypaisaNumber?.trim()),
    jazzcash: Boolean(settings?.jazzcashNumber?.trim()),
    bank: Boolean(
      settings?.bankName?.trim() &&
        settings?.bankAccountTitle?.trim() &&
        (settings?.bankAccountNumber?.trim() || settings?.bankIban?.trim()),
    ),
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Payments</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Customers pay by transfer and upload a receipt. You check it on the
        order page and approve it.
      </p>

      {notice === "saved" && (
        <p role="status" className="mt-6 border border-border bg-muted px-4 py-3 text-sm">
          Payment details saved.
        </p>
      )}
      {error === "invalid" && (
        <p
          role="alert"
          className="mt-6 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Please check the details. Account numbers can only use digits, letters,
          spaces and hyphens, and each box has a length limit.
        </p>
      )}

      <OrderList
        title="Receipts to check"
        empty="No receipts are waiting."
        orders={queues.toCheck}
      />
      <OrderList
        title="Waiting for payment"
        empty="No orders are waiting for payment."
        orders={queues.awaiting}
      />

      <form action={savePaymentSettings} className="mt-14 space-y-10">
        <h2 className="font-display text-2xl font-light">Your account details</h2>
        <p className="-mt-6 text-sm text-muted-foreground">
          Customers see these after placing an order. A method only appears at
          checkout when its details are filled in. To switch one off, clear its
          account number.
        </p>

        <fieldset className="space-y-4 border border-border p-4">
          <legend className="px-2 text-sm font-medium">
            Easypaisa{" "}
            <Badge variant={on.easypaisa ? "secondary" : "outline"}>
              {on.easypaisa ? "On" : "Off"}
            </Badge>
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="easypaisaTitle" label="Account title" defaultValue={settings?.easypaisaTitle} />
            <Field
              name="easypaisaNumber"
              label="Mobile account number"
              defaultValue={settings?.easypaisaNumber}
              inputMode="tel"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-border p-4">
          <legend className="px-2 text-sm font-medium">
            JazzCash{" "}
            <Badge variant={on.jazzcash ? "secondary" : "outline"}>
              {on.jazzcash ? "On" : "Off"}
            </Badge>
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="jazzcashTitle" label="Account title" defaultValue={settings?.jazzcashTitle} />
            <Field
              name="jazzcashNumber"
              label="Mobile account number"
              defaultValue={settings?.jazzcashNumber}
              inputMode="tel"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-border p-4">
          <legend className="px-2 text-sm font-medium">
            Bank transfer{" "}
            <Badge variant={on.bank ? "secondary" : "outline"}>
              {on.bank ? "On" : "Off"}
            </Badge>
          </legend>
          <p className="text-xs text-muted-foreground">
            Needs the bank name, the account title, and an account number or an
            IBAN.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="bankName" label="Bank name" defaultValue={settings?.bankName} />
            <Field name="bankAccountTitle" label="Account title" defaultValue={settings?.bankAccountTitle} />
            <Field name="bankAccountNumber" label="Account number" defaultValue={settings?.bankAccountNumber} />
            <Field name="bankIban" label="IBAN" defaultValue={settings?.bankIban} />
            <Field name="bankBranch" label="Branch (optional)" defaultValue={settings?.bankBranch} />
          </div>
        </fieldset>

        <div>
          <Label htmlFor="paymentNote">Extra instructions (optional)</Label>
          <textarea
            id="paymentNote"
            name="paymentNote"
            rows={3}
            maxLength={500}
            defaultValue={settings?.paymentNote ?? ""}
            className="mt-2 flex w-full border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Shown with the account details, for example how long you hold an
            unpaid order.
          </p>
        </div>

        <Button type="submit" size="lg">
          Save payment details
        </Button>
      </form>
    </div>
  );
}