import { z } from "zod";
import { PROVINCES } from "@/lib/checkout/provinces";

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Please keep your name under 80 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(120, "That email address is too long"),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s\-()]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\+?\d{10,15}$/, "Enter a phone number, for example 0300 1234567"),
    ),
  line1: z
    .string()
    .trim()
    .min(5, "Please enter your street address")
    .max(120, "Please keep it under 120 characters"),
  line2: z.string().trim().max(120, "Please keep it under 120 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Please enter your city")
    .max(60, "Please keep it under 60 characters"),
  province: z.enum(PROVINCES, { message: "Please choose your province" }),
  postalCode: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{5}$/.test(value), "Postal codes have 5 digits"),
  notes: z.string().trim().max(500, "Please keep your note under 500 characters"),
  discountCode: z.string().trim().max(40),
  saveAddress: z.boolean(),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const quoteSchema = z.object({
  province: z.string().max(60),
  city: z.string().max(60),
  discountCode: z.string().max(40),
});