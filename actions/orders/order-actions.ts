"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import type { OrderStatusValue } from "@/lib/order-labels";
import {
  canCancel,
  canRefund,
  nextForwardStatuses,
  shippingStatusFor,
} from "@/lib/orders/workflow";

const read = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

// Goes back to the order page with a message. It also refreshes every page
// that could show this order or its stock.
function back(
  id: string,
  query: { notice?: string; error?: string } = {},
): never {
  revalidatePath("/", "layout");
  const params = new URLSearchParams();
  if (query.notice) params.set("notice", query.notice);
  if (query.error) params.set("error", query.error);
  const text = params.toString();
  redirect(`/admin/orders/${id}${text ? `?${text}` : ""}`);
}

// ---------- Move an order forward ----------
export async function advanceOrder(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");
  const target = read(formData, "status") as OrderStatusValue;

  const order = await db.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!order) redirect("/admin/orders");

  if (!nextForwardStatuses(order.status).includes(target)) {
    back(id, { error: "not-allowed" });
  }

  // An artwork only leaves the gallery once its payment is approved
  if (target === "SHIPPED" || target === "DELIVERED") {
    const paid = await db.payment.count({
      where: { orderId: id, status: "PAID" },
    });
    if (paid === 0) back(id, { error: "not-paid" });
  }

  const result = await db.order.updateMany({
    // The "status: order.status" guard means only one change can win
    where: { id, status: order.status },
    data: { status: target, shippingStatus: shippingStatusFor(target) },
  });

  back(id, result.count === 1 ? { notice: "status-updated" } : { error: "changed" });
}

// ---------- Courier and tracking number ----------
export async function saveShipping(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");
  const carrier = read(formData, "carrier").trim();
  const trackingNumber = read(formData, "trackingNumber").trim();

  if (carrier.length > 60 || trackingNumber.length > 80) {
    back(id, { error: "too-long" });
  }

  await db.order.updateMany({
    where: { id },
    data: { carrier: carrier || null, trackingNumber: trackingNumber || null },
  });
  back(id, { notice: "shipping-saved" });
}

// ---------- Approve payment (also confirms a new order) ----------
export async function markPaid(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const outcome = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!order || order.status === "CANCELLED" || order.status === "REFUNDED") {
      return "not-allowed" as const;
    }

    const now = new Date();
    const paid = await tx.payment.updateMany({
      where: { orderId: id, status: "PENDING" },
      data: { status: "PAID", paidAt: now, verifiedAt: now, rejectionNote: null },
    });
    if (paid.count === 0) return "nothing" as const;

    // A new order whose payment is approved becomes confirmed
    await tx.order.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "CONFIRMED", shippingStatus: "NOT_SHIPPED" },
    });
    return "ok" as const;
  });

  back(
    id,
    outcome === "ok"
      ? { notice: "marked-paid" }
      : { error: outcome === "nothing" ? "changed" : "not-allowed" },
  );
}

// ---------- Reject a receipt: the customer sees the reason and can upload again ----------
export async function rejectReceipt(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");
  const note = read(formData, "note").trim();

  if (note.length < 3 || note.length > 200) back(id, { error: "note-needed" });

  const result = await db.payment.updateMany({
    where: { orderId: id, status: "PENDING", receiptSubmittedAt: { not: null } },
    data: { receiptSubmittedAt: null, rejectionNote: note },
  });
  back(id, result.count > 0 ? { notice: "receipt-rejected" } : { error: "changed" });
}

// ---------- Cancel (before shipping): the artwork goes back into stock ----------
export async function cancelOrder(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");
  if (formData.get("confirm") !== "on") back(id, { error: "confirm" });

  const outcome = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: { select: { variantId: true, quantity: true } },
        discountUsage: { select: { id: true, discountId: true } },
      },
    });
    if (!order || !canCancel(order.status)) return "not-allowed" as const;

    // Whoever gets this update first cancels it. The other request stops here,
    // so the stock can never be returned twice.
    const claimed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: "CANCELLED", shippingStatus: "NOT_SHIPPED" },
    });
    if (claimed.count !== 1) return "not-allowed" as const;

    for (const item of order.items) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // The discount code gets its use back
    if (order.discountUsage) {
      await tx.discount.updateMany({
        where: { id: order.discountUsage.discountId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
      await tx.discountUsage.delete({ where: { id: order.discountUsage.id } });
    }

    await tx.payment.updateMany({
      where: { orderId: id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    // If money was already taken, it must be given back by hand
    await tx.payment.updateMany({
      where: { orderId: id, status: "PAID" },
      data: { status: "REFUNDED" },
    });
    return "ok" as const;
  });

  back(id, outcome === "ok" ? { notice: "cancelled" } : { error: "not-allowed" });
}

// ---------- Refund (after shipping): this records it, it doesn't send money ----------
export async function refundOrder(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");
  if (formData.get("confirm") !== "on") back(id, { error: "confirm" });
  const restock = formData.get("restock") === "on";

  const outcome = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: { select: { variantId: true, quantity: true } } },
    });
    if (!order || !canRefund(order.status)) return "not-allowed" as const;

    const claimed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: "REFUNDED", shippingStatus: "RETURNED" },
    });
    if (claimed.count !== 1) return "not-allowed" as const;

    if (restock) {
      for (const item of order.items) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.payment.updateMany({
      where: { orderId: id, status: "PAID" },
      data: { status: "REFUNDED" },
    });
    return "ok" as const;
  });

  back(id, outcome === "ok" ? { notice: "refunded" } : { error: "not-allowed" });
}