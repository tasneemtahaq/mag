"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { canAccessOrder } from "@/lib/orders/access";
import { isPaymentMethod } from "@/lib/payments/methods";
import { createReceiptUploadSignature } from "@/lib/storage/cloudinary";
import { MAX_RECEIPTS_PER_ORDER, RECEIPT_FOLDER } from "@/lib/storage/limits";

type Gate =
  | { ok: true; paymentId: string }
  | { ok: false; message: string };

// Is this visitor allowed to send a receipt for this order right now?
async function checkAccess(orderId: string): Promise<Gate> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          provider: true,
          status: true,
          _count: { select: { receipts: true } },
        },
      },
    },
  });

  // The same answer for "no such order" and "not yours"
  if (!order || !(await canAccessOrder(order))) {
    return { ok: false, message: "We couldn't find this order." };
  }
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return { ok: false, message: "This order is closed." };
  }

  const payment = order.payments[0];
  if (!payment || !isPaymentMethod(payment.provider)) {
    return { ok: false, message: "This order doesn't take a receipt." };
  }
  if (payment.status !== "PENDING") {
    return { ok: false, message: "Payment for this order has already been handled." };
  }
  if (payment._count.receipts >= MAX_RECEIPTS_PER_ORDER) {
    return {
      ok: false,
      message: `You can upload up to ${MAX_RECEIPTS_PER_ORDER} receipts for one order. Please contact the gallery.`,
    };
  }
  return { ok: true, paymentId: payment.id };
}

// Step 1 of an upload: permission to send ONE file straight to Cloudinary
export async function getReceiptUploadSignature(orderId: string) {
  const gate = await checkAccess(orderId);
  if (!gate.ok) return gate;
  return { ok: true as const, ...createReceiptUploadSignature() };
}

const receiptSchema = z.object({
  publicId: z.string().startsWith(`${RECEIPT_FOLDER}/`).max(200),
  format: z.enum(["jpg", "jpeg", "png", "webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const referenceSchema = z
  .string()
  .trim()
  .max(60)
  .regex(/^[A-Za-z0-9 _\-./]*$/);

// Step 2: attach the uploaded receipt to the order's payment
export async function submitReceipt(
  orderId: string,
  uploaded: unknown,
  reference: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await checkAccess(orderId);
  if (!gate.ok) return gate;

  const file = receiptSchema.safeParse(uploaded);
  if (!file.success) {
    return { ok: false, message: "The uploaded receipt details were not valid." };
  }
  const ref = referenceSchema.safeParse(reference ?? "");
  if (!ref.success) {
    return {
      ok: false,
      message:
        "The transaction ID can only contain letters, numbers, spaces and - _ . /",
    };
  }

  try {
    await db.$transaction([
      db.paymentReceipt.create({
        data: {
          paymentId: gate.paymentId,
          publicId: file.data.publicId,
          format: file.data.format,
          width: file.data.width,
          height: file.data.height,
        },
      }),
      db.payment.update({
        where: { id: gate.paymentId },
        data: {
          receiptSubmittedAt: new Date(),
          rejectionNote: null,
          ...(ref.data ? { payerReference: ref.data } : {}),
        },
      }),
    ]);
  } catch {
    return { ok: false, message: "We couldn't save your receipt. Please try again." };
  }

  revalidatePath(`/checkout/confirmation/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}