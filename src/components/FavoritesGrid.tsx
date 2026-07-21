"use client";

import { useState } from "react";
import { DressDetailsDrawer } from "@/components/DressDetailsDrawer";
import { dressPhotos } from "@/lib/dresses";
import type { DressCard, DressPrepFavorite } from "@/lib/types";

type Props = {
  favorites: DressPrepFavorite[];
  dresses?: DressCard[];
  canEdit: boolean;
  onRemove?: (shopifyProductId: string) => Promise<void>;
};

export function FavoritesGrid({
  favorites,
  dresses = [],
  canEdit,
  onRemove,
}: Props) {
  const [photoIndexById, setPhotoIndexById] = useState<Record<string, number>>(
    {},
  );
  const [detailsFavoriteId, setDetailsFavoriteId] = useState<string | null>(
    null,
  );

  if (!favorites.length) {
    return (
      <p className="rounded-[1.25rem] bg-white px-4 py-8 text-center text-[var(--muted)] ring-1 ring-black/5">
        No favorites yet.
      </p>
    );
  }

  function photosFor(fav: DressPrepFavorite) {
    const dress = dresses.find(
      (d) => d.shopifyProductId === fav.shopify_product_id,
    );
    return dressPhotos(dress?.imageUrls, dress?.imageUrl ?? fav.image_url);
  }

  function descriptionHtmlFor(fav: DressPrepFavorite) {
    if (fav.description_html) return fav.description_html;
    const dress = dresses.find(
      (d) => d.shopifyProductId === fav.shopify_product_id,
    );
    return dress?.descriptionHtml ?? null;
  }

  function cyclePhoto(favId: string, photoCount: number) {
    setPhotoIndexById((prev) => ({
      ...prev,
      [favId]: ((prev[favId] ?? 0) + 1) % photoCount,
    }));
  }

  async function handleRemove(shopifyProductId: string) {
    if (!onRemove) return;
    if (detailsFavoriteId) {
      const open = favorites.find((f) => f.id === detailsFavoriteId);
      if (open?.shopify_product_id === shopifyProductId) {
        setDetailsFavoriteId(null);
      }
    }
    await onRemove(shopifyProductId);
  }

  const detailsFavorite = detailsFavoriteId
    ? favorites.find((f) => f.id === detailsFavoriteId) ?? null
    : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        {favorites.map((fav) => {
          const photos = photosFor(fav);
          const photoIndex = photoIndexById[fav.id] ?? 0;
          const activePhoto = photos[photoIndex] ?? photos[0] ?? null;
          const hasMorePhotos = photos.length > 1;

          return (
            <li key={fav.id} className="flex min-w-0">
              <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white text-center ring-1 ring-black/5">
                <div
                  className="relative w-full shrink-0 overflow-hidden bg-[#eee]"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  {activePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activePhoto}
                      alt={fav.title}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : null}

                  <div className="absolute bottom-2 left-2 right-2 z-10 flex items-end justify-between gap-2">
                    <button
                      type="button"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--blush-soft)] p-0 text-[var(--ink)] ring-1 ring-[var(--blush)] backdrop-blur-sm"
                      onClick={() => setDetailsFavoriteId(fav.id)}
                      aria-label={`View description for ${fav.title}`}
                      title="View description"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v6" strokeLinecap="round" />
                        <circle
                          cx="12"
                          cy="8"
                          r="1"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    </button>

                    {hasMorePhotos ? (
                      <button
                        type="button"
                        className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs"
                        onClick={() => cyclePhoto(fav.id, photos.length)}
                      >
                        More photos · {photoIndex + 1}/{photos.length}
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>

                <div className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--ink)]">
                    {fav.title}
                  </p>
                  {canEdit && onRemove ? (
                    <button
                      type="button"
                      onClick={() => void handleRemove(fav.shopify_product_id)}
                      className="text-[11px] text-red-600 underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {detailsFavorite ? (
        <DressDetailsDrawer
          title={detailsFavorite.title}
          descriptionHtml={descriptionHtmlFor(detailsFavorite)}
          productUrl={detailsFavorite.product_url}
          onClose={() => setDetailsFavoriteId(null)}
        />
      ) : null}
    </>
  );
}
