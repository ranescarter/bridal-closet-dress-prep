/** Soft copy for estimated dress arrival (not a hard promise). */

export function formatEstimatedArrivalLine(
  estimatedArrivalOn: string | null | undefined,
): string | null {
  if (!estimatedArrivalOn) return null;
  const raw = estimatedArrivalOn.slice(0, 10);
  const date = new Date(`${raw}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return null;

  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `Estimated arrival around ${formatted}. Timing can change with shipping and alterations.`;
}

export function hasSaidYesContent(session: {
  said_yes_title?: string | null;
  said_yes_shopify_product_id?: string | null;
  estimated_arrival_on?: string | null;
}): boolean {
  return Boolean(
    (session.said_yes_title && session.said_yes_title.trim()) ||
      session.said_yes_shopify_product_id ||
      session.estimated_arrival_on,
  );
}

export function arrivalInputValue(
  estimatedArrivalOn: string | null | undefined,
): string {
  if (!estimatedArrivalOn) return "";
  return estimatedArrivalOn.slice(0, 10);
}
