import type {
  OrderStatusValue,
  ShippingStatusValue,
} from "@/lib/order-labels";

// The normal path of an order. You can skip steps, but never go backwards.
const FORWARD_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export function nextForwardStatuses(status: OrderStatusValue): OrderStatusValue[] {
  const index = (FORWARD_FLOW as readonly string[]).indexOf(status);
  // Cancelled and refunded orders are finished
  if (index === -1) return [];
  return FORWARD_FLOW.slice(index + 1);
}

// Cancelling is only possible before the artwork leaves the gallery
export const canCancel = (status: OrderStatusValue) =>
  status === "PENDING" || status === "CONFIRMED" || status === "PROCESSING";

// Refunding is only possible once the artwork has left the gallery
export const canRefund = (status: OrderStatusValue) =>
  status === "SHIPPED" || status === "DELIVERED";

const SHIPPING_FOR: Partial<Record<OrderStatusValue, ShippingStatusValue>> = {
  CONFIRMED: "NOT_SHIPPED",
  PROCESSING: "PREPARING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
};

// The delivery status that goes with an order status
export const shippingStatusFor = (status: OrderStatusValue) =>
  SHIPPING_FOR[status];