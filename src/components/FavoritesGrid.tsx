"use client";

import { useState } from "react";
import { DressDetailsDrawer } from "@/components/DressDetailsDrawer";
import { FavoritePhotoLightbox } from "@/components/FavoritePhotoLightbox";
import { MorePhotosControl } from "@/components/MorePhotosControl";
import { dressPhotos, shopifyCdnUrl } from "@/lib/dresses";
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
  const [lightboxFavoriteId, setLightboxFavoriteId] = useState<string | null>(
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

  function setPhotoIndex(favId: string, index: number) {
    setPhotoIndexById((prev) => ({
      ...prev,
      [favId]: index,
    }));
  }

  function cyclePhoto(favId: string, photoCount: number, delta: number) {
    setPhotoIndexById((prev) => ({
      ...prev,
      [favId]: ((prev[favId] ?? 0) + delta + photoCount) % photoCount,
    }));
  }

  function goToNeighborDress(delta: number) {
    if (!lightboxFavoriteId) return;
    const currentIndex = favorites.findIndex((f) => f.id === lightboxFavoriteId);
    if (currentIndex < 0) return;
    const nextIndex =
      (currentIndex + delta + favorites.length) % favorites.length;
    setLightboxFavoriteId(favorites[nextIndex].id);
  }

  async function handleRemove(shopifyProductId: string) {
    if (!onRemove) return;
    if (detailsFavoriteId) {
      const open = favorites.find((f) => f.id === detailsFavoriteId);
      if (open?.shopify_product_id === shopifyProductId) {
        setDetailsFavoriteId(null);
      }
    }
    if (lightboxFavoriteId) {
      const open = favorites.find((f) => f.id === lightboxFavoriteId);
      if (open?.shopify_product_id === shopifyProductId) {
        setLightboxFavoriteId(null);
      }
    }
    await onRemove(shopifyProductId);
  }

  const detailsFavorite = detailsFavoriteId
    ? (favorites.find((f) => f.id === detailsFavoriteId) ?? null)
    : null;

  const lightboxFavorite = lightboxFavoriteId
    ? (favorites.find((f) => f.id === lightboxFavoriteId) ?? null)
    : null;

  const lightboxPhotos = lightboxFavorite ? photosFor(lightboxFavorite) : [];
  const canNavDresses = favorites.length > 1;

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
                    <button
                      type="button"
                      className="absolute inset-0 block h-full w-full cursor-zoom-in"
                      onClick={() => setLightboxFavoriteId(fav.id)}
                      aria-label={`View larger photo of ${fav.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          shopifyCdnUrl(activePhoto, 480) || activePhoto
                        }
                        alt=""
                        className="h-full w-full object-cover object-top"
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ) : null}

                  {/* Overlay controls sit above the image button; enlarged hit areas */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1 p-1">
                    <button
                      type="button"
                      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDetailsFavoriteId(fav.id);
                      }}
                      aria-label={`View description for ${fav.title}`}
                      title="View description"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--blush-soft)] ring-1 ring-[var(--blush)] backdrop-blur-sm">
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
                      </span>
                    </button>

                    {hasMorePhotos ? (
                      <MorePhotosControl
                        variant="overlay"
                        index={photoIndex}
                        count={photos.length}
                        onPrev={() => cyclePhoto(fav.id, photos.length, -1)}
                        onNext={() => cyclePhoto(fav.id, photos.length, 1)}
                      />
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
          shopifyProductId={detailsFavorite.shopify_product_id}
          productUrl={detailsFavorite.product_url}
          onClose={() => setDetailsFavoriteId(null)}
        />
      ) : null}

      {lightboxFavorite && lightboxPhotos.length > 0 ? (
        <FavoritePhotoLightbox
          title={lightboxFavorite.title}
          photos={lightboxPhotos}
          initialIndex={photoIndexById[lightboxFavorite.id] ?? 0}
          onClose={() => setLightboxFavoriteId(null)}
          onIndexChange={(index) => setPhotoIndex(lightboxFavorite.id, index)}
          canPrevDress={canNavDresses}
          canNextDress={canNavDresses}
          onPrevDress={() => goToNeighborDress(-1)}
          onNextDress={() => goToNeighborDress(1)}
        />
      ) : null}
    </>
  );
}
