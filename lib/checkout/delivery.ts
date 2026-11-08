import "server-only";
import { Prisma } from "@/generated/prisma/client";

const Decimal = Prisma.Decimal;
type Money = Prisma.Decimal;

export const CM_PER_INCH = 2.54;
// Delivery prices are rounded UP to the next multiple of this (in rupees)
export const ROUND_STEP = 50;

export type SizeShippingSettings = {
  refHeightIn: Money;
  refWidthIn: Money;
  refThicknessIn: Money;
  refPrice: Money;
  minPerItem: Money;
};

// Used if the settings row doesn't exist yet
const DEFAULTS: SizeShippingSettings = {
  refHeightIn: new Decimal(36),
  refWidthIn: new Decimal(24),
  refThicknessIn: new Decimal(3),
  refPrice: new Decimal(1500),
  minPerItem: new Decimal(0),
};

export function sizeShippingFrom(
  settings: {
    shipRefHeightIn: Money;
    shipRefWidthIn: Money;
    shipRefThicknessIn: Money;
    shipRefPrice: Money;
    shipMinPerItem: Money;
  } | null,
): SizeShippingSettings {
  if (!settings) return DEFAULTS;
  return {
    refHeightIn: settings.shipRefHeightIn,
    refWidthIn: settings.shipRefWidthIn,
    refThicknessIn: settings.shipRefThicknessIn,
    refPrice: settings.shipRefPrice,
    minPerItem: settings.shipMinPerItem,
  };
}

// Centimetres (how sizes are stored) to inches (how you think about frames)
export function cmToInches(cm: Money | null | undefined) {
  return cm && cm.gt(0) ? cm.div(CM_PER_INCH).toDecimalPlaces(2) : null;
}

// The delivery cost of ONE artwork. A size that is unknown is treated as the
// standard package, so an artwork with no size at all costs the reference price.
export function deliveryForItem(
  size: {
    heightIn: Money | null;
    widthIn: Money | null;
    thicknessIn: Money | null;
  },
  settings: SizeShippingSettings,
): Money {
  const height = size.heightIn ?? settings.refHeightIn;
  const width = size.widthIn ?? settings.refWidthIn;
  const thickness = size.thicknessIn ?? settings.refThicknessIn;

  const volume = height.mul(width).mul(thickness);
  const referenceVolume = settings.refHeightIn
    .mul(settings.refWidthIn)
    .mul(settings.refThicknessIn);
  if (referenceVolume.lte(0)) return settings.refPrice;

  // The price grows in step with the volume, compared with your reference frame
  const raw = settings.refPrice.mul(volume).div(referenceVolume);
  const rounded = raw.div(ROUND_STEP).ceil().mul(ROUND_STEP);
  return Decimal.max(rounded, settings.minPerItem);
}

// Is the customer's city Rawalpindi? They type it themselves, so be forgiving.
export function isRawalpindi(city: string) {
  const letters = city.toLowerCase().replace(/[^a-z]/g, "");
  return (
    letters.includes("rawalpindi") || letters === "rwp" || letters === "pindi"
  );
}