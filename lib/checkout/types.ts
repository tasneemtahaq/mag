// What the server tells the checkout page (all plain numbers)
export type Quote = {
  subtotal: number;
  // null until the customer has chosen a province
  shippingCost: number | null;
  shippingLabel: string;
  discountTotal: number;
  discountCode: string | null;
  total: number;
};

export type QuoteResult =
  | { ok: true; quote: Quote; discountError: string | null }
  | { ok: false; message: string };

// Placing an order either redirects to the confirmation page (success) or fails like this
export type PlaceOrderResult = {
  ok: false;
  message: string;
  errors?: Record<string, string>;
};