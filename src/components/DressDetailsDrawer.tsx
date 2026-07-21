"use client";

import { useEffect, useState } from "react";
import { stripHtml } from "@/lib/filters";

type Props = {
  title: string;
  descriptionHtml: string | null;
  /** When descriptionHtml is null, fetch from catalog by product id. */
  shopifyProductId?: string | null;
  productUrl: string | null;
  onClose: () => void;
};

export function DressDetailsDrawer({
  title,
  descriptionHtml,
  shopifyProductId = null,
  productUrl,
  onClose,
}: Props) {
  const [loadedHtml, setLoadedHtml] = useState<string | null>(descriptionHtml);
  const [loadingDescription, setLoadingDescription] = useState(
    !descriptionHtml && Boolean(shopifyProductId),
  );
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setLoadedHtml(descriptionHtml);
    setLoadingDescription(!descriptionHtml && Boolean(shopifyProductId));
  }, [descriptionHtml, shopifyProductId]);

  useEffect(() => {
    if (descriptionHtml || !shopifyProductId) return;

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/dresses/description?id=${encodeURIComponent(shopifyProductId!)}`,
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setLoadedHtml(data.descriptionHtml || null);
        }
      } catch {
        // Keep empty description on failure.
      } finally {
        if (!cancelled) setLoadingDescription(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [descriptionHtml, shopifyProductId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const description = stripHtml(loadedHtml);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dress-details-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close description"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet · Desktop: right drawer */}
      <aside
        className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-[var(--paper)] shadow-2xl transition-transform duration-300 ease-out md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-none md:border-l md:border-[var(--blush)] ${
          entered
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        <div
          className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-black/15 md:hidden"
          aria-hidden
        />

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--blush)] px-5 py-4">
          <h2
            id="dress-details-title"
            className="font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--blush-soft)] text-2xl leading-none text-[var(--ink)] ring-1 ring-black/5"
            aria-label="Close description"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loadingDescription ? (
            <p className="text-base text-[var(--muted)]">Loading description…</p>
          ) : description ? (
            <p className="whitespace-pre-line text-base leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          ) : (
            <p className="text-base text-[var(--muted)]">
              No description available for this gown.
            </p>
          )}
        </div>

        {productUrl ? (
          <div className="shrink-0 border-t border-black/5 px-5 py-4">
            <a
              href={productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-base font-medium text-[var(--ink)] underline"
            >
              View on website
            </a>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
