import { z } from "zod";

export const MONEY = /^\d{1,12}(\.\d{1,2})?$/;
export const MONEY_MESSAGE = "Enter an amount like 5000 or 5000.50";

export const money = z.string().trim().regex(MONEY, MONEY_MESSAGE);

export const optionalMoney = z
  .string()
  .trim()
  .refine((value) => value === "" || MONEY.test(value), MONEY_MESSAGE);

export const optionalWholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d{1,9}$/.test(value) && Number(value) >= min && Number(value) <= max),
      `${label} must be a whole number from ${min} to ${max}`,
    );

// A calendar date typed in a date box ("2026-06-30"), or nothing
export const optionalDate = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(new Date(`${value}T00:00:00+05:00`).getTime())),
    "Enter a real date",
  );