/**
 * Price bands for client filters. Raw prices stay server-side;
 * only these ids are sent to the browser.
 */
export const PRICE_RANGE_IDS = [
  "under-1000",
  "1000-1499",
  "1500-1999",
  "2000-2499",
  "2500-plus",
] as const;

export type PriceRangeId = (typeof PRICE_RANGE_IDS)[number];

/** Map a Shopify variant price (USD dollars) to a band id. */
export function priceAmountToRangeId(
  amount: number | null | undefined,
): PriceRangeId | null {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return null;
  if (amount < 1000) return "under-1000";
  if (amount < 1500) return "1000-1499";
  if (amount < 2000) return "1500-1999";
  if (amount < 2500) return "2000-2499";
  return "2500-plus";
}
