export function dressPhotos(
  imageUrls: string[] | undefined,
  imageUrl: string | null | undefined,
) {
  if (imageUrls?.length) return imageUrls;
  if (imageUrl) return [imageUrl];
  return [];
}
