"use client";

import { useEffect, useMemo, useState } from "react";
import { dressPhotos } from "@/lib/dresses";
import { stripHtml } from "@/lib/filters";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoIndexById, setPhotoIndexById] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    if (!favorites.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && favorites.some((f) => f.id === current)) return current;
      return favorites[0].id;
    });
  }, [favorites]);

  const selectedIndex = useMemo(
    () => favorites.findIndex((f) => f.id === selectedId),
    [favorites, selectedId],
  );

  const selected =
    selectedIndex >= 0 ? favorites[selectedIndex] : favorites[0] ?? null;

  if (!favorites.length) {
    return (
      <p className="rounded-[1.25rem] bg-white px-4 py-8 text-center text-[var(--muted)] ring-1 ring-black/5">
        No favorites yet.
      </p>
    );
  }

  if (!selected) return null;

  function photosFor(fav: DressPrepFavorite) {
    const dress = dresses.find(
      (d) => d.shopifyProductId === fav.shopify_product_id,
    );
    return dressPhotos(dress?.imageUrls, dress?.imageUrl ?? fav.image_url);
  }

  function descriptionFor(fav: DressPrepFavorite) {
    if (fav.description_html) return stripHtml(fav.description_html);
    const dress = dresses.find(
      (d) => d.shopifyProductId === fav.shopify_product_id,
    );
    return stripHtml(dress?.descriptionHtml);
  }

  function selectByOffset(offset: number) {
    if (favorites.length < 2) return;
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    const next = (index + offset + favorites.length) % favorites.length;
    setSelectedId(favorites[next].id);
  }

  function cyclePhoto(favId: string, photoCount: number) {
    setPhotoIndexById((prev) => ({
      ...prev,
      [favId]: ((prev[favId] ?? 0) + 1) % photoCount,
    }));
  }

  async function handleRemove(shopifyProductId: string) {
    if (!onRemove) return;
    const index = favorites.findIndex(
      (f) => f.shopify_product_id === shopifyProductId,
    );
    await onRemove(shopifyProductId);
    const remaining = favorites.filter(
      (f) => f.shopify_product_id !== shopifyProductId,
    );
    if (!remaining.length) {
      setSelectedId(null);
      return;
    }
    const fallback = remaining[Math.min(index, remaining.length - 1)];
    setSelectedId(fallback.id);
  }

  const description = descriptionFor(selected);
  const showNav = favorites.length > 1;
  const positionLabel = `${selectedIndex + 1} of ${favorites.length}`;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {favorites.map((fav) => {
          const active = fav.id === selected.id;
          const photos = photosFor(fav);
          const photoIndex = photoIndexById[fav.id] ?? 0;
          const activePhoto = photos[photoIndex] ?? photos[0] ?? null;
          const hasMorePhotos = photos.length > 1;

          return (
            <li key={fav.id} className="flex min-w-0">
              <div
                className={`flex w-full flex-col overflow-hidden rounded-xl text-center transition ${
                  active
                    ? "bg-[var(--blush-soft)] shadow-[inset_0_0_0_2px_var(--blush)]"
                    : "bg-white ring-1 ring-black/5 hover:ring-[var(--blush)]/60"
                }`}
              >
                <div
                  className="relative w-full shrink-0 cursor-pointer overflow-hidden bg-[#eee]"
                  style={{ aspectRatio: "3 / 4" }}
                  onClick={() => setSelectedId(fav.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(fav.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`Select ${fav.title}`}
                >
                  {activePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activePhoto}
                      alt={fav.title}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : null}

                  {hasMorePhotos ? (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        cyclePhoto(fav.id, photos.length);
                      }}
                    >
                      More photos · {photoIndex + 1}/{photos.length}
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedId(fav.id)}
                  aria-pressed={active}
                  className={`line-clamp-2 flex h-11 w-full items-center justify-center px-2 text-xs font-medium leading-snug text-[var(--ink)] ${
                    active ? "bg-[var(--blush)]" : "bg-white"
                  }`}
                >
                  {fav.title}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5 lg:min-h-[28rem]">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--ink)] sm:text-2xl">
            {selected.title}
          </h3>
          {showNav ? (
            <p className="shrink-0 pt-1 text-xs text-[var(--muted)]">
              {positionLabel}
            </p>
          ) : null}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-[var(--blush)] pb-3">
          {selected.product_url ? (
            <a
              href={selected.product_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[var(--ink)] underline"
            >
              View on website
            </a>
          ) : null}
          {canEdit && onRemove ? (
            <button
              type="button"
              onClick={() => void handleRemove(selected.shopify_product_id)}
              className="text-sm text-red-600 underline"
            >
              Remove
            </button>
          ) : null}

          {showNav ? (
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => selectByOffset(-1)}
                className="rounded-full bg-[var(--blush-soft)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] ring-1 ring-black/5 transition hover:bg-[var(--blush)]"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => selectByOffset(1)}
                className="rounded-full bg-[var(--blush)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--blush)]/80"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {description}
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              No description saved for this gown.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
