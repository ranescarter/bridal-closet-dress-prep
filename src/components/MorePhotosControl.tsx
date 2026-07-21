"use client";

type Props = {
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
  /** Visual style for grid overlay vs lightbox / swipe deck */
  variant?: "overlay" | "lightbox" | "deck";
};

/**
 * Bidirectional photo pager: ‹ image 1 of 3 ›
 * Hidden when a dress has only one photo.
 */
export function MorePhotosControl({
  index,
  count,
  onPrev,
  onNext,
  className = "",
  variant = "overlay",
}: Props) {
  if (count <= 1) return null;

  const label = `Image ${index + 1} of ${count}`;
  const ariaLabel = label;

  if (variant === "overlay") {
    // Visual height matches the info icon (24px); tap area stays ~44px tall.
    return (
      <div
        className={`pointer-events-auto flex h-11 items-center ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        <div className="inline-flex h-6 items-center overflow-hidden rounded-full bg-black/55 text-[10px] font-medium leading-none text-white backdrop-blur-sm">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            className="flex h-11 w-7 shrink-0 -my-[10px] items-center justify-center"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <span className="whitespace-nowrap px-0.5">{label}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            className="flex h-11 w-7 shrink-0 -my-[10px] items-center justify-center"
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  if (variant === "lightbox") {
    return (
      <div
        className={`inline-flex items-stretch overflow-hidden rounded-full bg-white/15 text-sm font-medium text-white ring-1 ring-white/25 ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        <button
          type="button"
          onClick={onPrev}
          className="flex min-h-11 min-w-10 items-center justify-center px-3"
          aria-label="Previous photo"
        >
          ‹
        </button>
        <span className="flex min-h-11 items-center px-2">{label}</span>
        <button
          type="button"
          onClick={onNext}
          className="flex min-h-11 min-w-10 items-center justify-center px-3"
          aria-label="Next photo"
        >
          ›
        </button>
      </div>
    );
  }

  // deck — compact, aligned with swipe card chrome
  return (
    <div
      className={`inline-flex h-7 items-center overflow-hidden rounded-full bg-black/55 text-[11px] font-medium text-white backdrop-blur-sm ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={onPrev}
        className="flex h-7 min-w-7 items-center justify-center px-1.5"
        aria-label="Previous photo"
      >
        ‹
      </button>
      <span className="whitespace-nowrap px-0.5">{label}</span>
      <button
        type="button"
        onClick={onNext}
        className="flex h-7 min-w-7 items-center justify-center px-1.5"
        aria-label="Next photo"
      >
        ›
      </button>
    </div>
  );
}
