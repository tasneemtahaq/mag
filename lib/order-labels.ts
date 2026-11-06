export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type ShippingStatusValue =
  | "NOT_SHIPPED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED";

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_VALUES = Object.keys(
  ORDER_STATUS_LABEL,
) as OrderStatusValue[];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatusValue, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  FAILED: "Not collected",
  REFUNDED: "Refunded",
};

export const SHIPPING_STATUS_LABEL: Record<ShippingStatusValue, string> = {
  NOT_SHIPPED: "Not shipped",
  PREPARING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RETURNED: "Returned",
};

export function paymentProviderLabel(provider: string) {
  switch (provider) {
    case "easypaisa":
      return "Easypaisa";
    case "jazzcash":
      return "JazzCash";
    case "bank_transfer":
      return "Bank transfer";
    case "cod":
      // Only old test orders have this
      return "Cash on delivery (old)";
    default:
      return provider;
  }
}

// Which badge style to use for an order status
export function orderBadgeVariant(status: OrderStatusValue) {
  if (status === "PENDING") return "default" as const;
  if (status === "CANCELLED" || status === "REFUNDED") return "outline" as const;
  return "secondary" as const;
}