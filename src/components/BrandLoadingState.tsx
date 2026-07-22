"use client";

const TAGLINE = "All Brides, All Bodies, All Beautiful";

type Props = {
  /** Full-page first paint vs panel inside the swipe area */
  variant?: "page" | "panel";
  hint?: string;
};

export function BrandLoadingState({
  variant = "page",
  hint = "Preparing your appointment…",
}: Props) {
  if (variant === "panel") {
    return (
      <div className="flex min-h-[28rem] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-black/5">
        <p className="font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl">
          {TAGLINE}
        </p>
        <div
          className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--blush-soft)]"
          aria-hidden
        >
          <div className="brand-loading-bar h-full w-1/2 rounded-full bg-[var(--blush)]" />
        </div>
        {hint ? (
          <p className="text-sm text-[var(--muted)]">{hint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <p className="max-w-md font-[family-name:var(--font-display)] text-3xl leading-snug text-[var(--ink)] sm:text-4xl">
        {TAGLINE}
      </p>
      <div
        className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--blush-soft)]"
        aria-hidden
      >
        <div className="brand-loading-bar h-full w-1/2 rounded-full bg-[var(--blush)]" />
      </div>
      {hint ? <p className="text-sm text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
