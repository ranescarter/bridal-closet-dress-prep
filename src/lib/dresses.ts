/** Resize Shopify CDN image URLs without fetching a new asset. */
export function shopifyCdnUrl(
  url: string | null | undefined,
  width: number,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function dressPhotos(
  imageUrls: string[] | undefined,
  imageUrl: string | null | undefined,
) {
  if (imageUrls?.length) return imageUrls;
  if (imageUrl) return [imageUrl];
  return [];
}
