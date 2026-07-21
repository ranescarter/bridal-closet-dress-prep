"use client";

import { useEffect, useState } from "react";
import { MorePhotosControl } from "@/components/MorePhotosControl";

type Props = {
  title: string;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** Side arrows move between saved dresses (not photos). */
  onPrevDress?: () => void;
  onNextDress?: () => void;
  canPrevDress?: boolean;
  canNextDress?: boolean;
};

function sizedPhoto(url: string, width: number) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function FavoritePhotoLightbox({
  title,
  photos,
  initialIndex = 0,
  onClose,
  onIndexChange,
  onPrevDress,
  onNextDress,
  canPrevDress = false,
  canNextDress = false,
}: Props) {
  const safeInitial =
    photos.length > 0
      ? Math.min(Math.max(initialIndex, 0), photos.length - 1)
      : 0;
  const [index, setIndex] = useState(safeInitial);
  const [entered, setEntered] = useState(false);

  const showDressNav = canPrevDress || canNextDress;

  useEffect(() => {
    setIndex(safeInitial);
  }, [safeInitial, title]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && canNextDress) onNextDress?.();
      if (event.key === "ArrowLeft" && canPrevDress) onPrevDress?.();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, canNextDress, canPrevDress, onNextDress, onPrevDress]);

  const activePhoto = photos[index] ?? null;
  const hasMorePhotos = photos.length > 1;

  function goToPhoto(next: number) {
    setIndex(next);
    onIndexChange?.(next);
  }

  function cyclePhoto(delta: number) {
    if (!hasMorePhotos) return;
    goToPhoto((index + delta + photos.length) % photos.length);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
    >
      <div
        className={`flex items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="min-w-0 flex-1 pt-1 font-[family-name:var(--font-display)] text-lg leading-snug text-white sm:text-xl">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white ring-1 ring-white/25"
          aria-label="Close photo"
        >
          ×
        </button>
      </div>

      <div
        className={`relative flex min-h-0 flex-1 items-center justify-center px-3 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        {activePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sizedPhoto(activePhoto, 1600)}
            alt={title}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <p className="text-white/70">No image</p>
        )}

        {showDressNav ? (
          <>
            {canPrevDress ? (
              <button
                type="button"
                onClick={onPrevDress}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white ring-1 ring-white/25 sm:left-4"
                aria-label="Previous saved dress"
              >
                ‹
              </button>
            ) : null}
            {canNextDress ? (
              <button
                type="button"
                onClick={onNextDress}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white ring-1 ring-white/25 sm:right-4"
                aria-label="Next saved dress"
              >
                ›
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <div
        className={`flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      >
        <MorePhotosControl
          variant="lightbox"
          index={index}
          count={photos.length}
          onPrev={() => cyclePhoto(-1)}
          onNext={() => cyclePhoto(1)}
        />
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-white/75 underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}
