"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DressDetailsDrawer } from "@/components/DressDetailsDrawer";
import { MorePhotosControl } from "@/components/MorePhotosControl";
import { StyleReference } from "@/components/StyleReference";
import { dressPhotos } from "@/lib/dresses";
import {
  CLIENT_FILTER_GROUPS,
  dressMatchesFilters,
  dressMatchesSearch,
} from "@/lib/filters";
import type { DressCard } from "@/lib/types";

type Props = {
  dresses: DressCard[];
  favoritedIds: Set<string>;
  atSaveLimit?: boolean;
  onSave: (dress: DressCard) => Promise<void>;
};

export function SwipeDeck({
  dresses,
  favoritedIds,
  atSaveLimit = false,
  onSave,
}: Props) {
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => new Set());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    () => new Set(),
  );
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [showStyleReference, setShowStyleReference] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!atSaveLimit) setLimitMessage(null);
  }, [atSaveLimit]);
  const [busy, setBusy] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const startX = useRef(0);

  const hasSearch = searchQuery.trim().length > 0;

  const filtered = useMemo(
    () =>
      dresses.filter(
        (d) =>
          dressMatchesSearch(d.title, searchQuery) &&
          dressMatchesFilters(
            d.tags || [],
            selectedFilters,
            d.priceRangeId,
            d.vendor,
          ),
      ),
    [dresses, selectedFilters, searchQuery],
  );

  const queue = useMemo(
    () =>
      filtered.filter((d) => {
        if (skippedIds.has(d.shopifyProductId)) return false;
        if (hasSearch) return true;
        return !favoritedIds.has(d.shopifyProductId);
      }),
    [filtered, favoritedIds, skippedIds, hasSearch],
  );

  const current = queue[0] ?? null;
  const currentAlreadySaved = current
    ? favoritedIds.has(current.shopifyProductId)
    : false;

  useEffect(() => {
    setOffsetX(0);
    setImageIndex(0);
    setShowDetails(false);
  }, [current?.shopifyProductId]);

  const photos = dressPhotos(current?.imageUrls, current?.imageUrl);
  const activePhoto = photos[imageIndex] ?? photos[0] ?? null;
  const hasMorePhotos = photos.length > 1;

  function toggleFilter(id: string) {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSection(id: string) {
    setOpenSectionId((current) => (current === id ? null : id));
  }

  function applyStyleReferenceFilter(filterId: string) {
    setSelectedFilters((previous) => new Set(previous).add(filterId));
    const group = CLIENT_FILTER_GROUPS.find((candidate) =>
      candidate.options.some((option) => option.id === filterId),
    );
    if (group) setOpenSectionId(group.id);
    setShowStyleReference(false);
  }

  function selectedCountForGroup(groupId: string) {
    const group = CLIENT_FILTER_GROUPS.find((g) => g.id === groupId);
    if (!group) return 0;
    return group.options.filter((o) => selectedFilters.has(o.id)).length;
  }

  async function decide(direction: "left" | "right") {
    if (!current || busy) return;

    if (
      direction === "right" &&
      !favoritedIds.has(current.shopifyProductId) &&
      atSaveLimit
    ) {
      setLimitMessage(
        "You can save up to ten dresses. Remove one to save another.",
      );
      return;
    }

    setBusy(true);
    setOffsetX(direction === "right" ? 420 : -420);
    try {
      if (direction === "right") {
        if (!favoritedIds.has(current.shopifyProductId)) {
          setLimitMessage(null);
          await onSave(current);
        } else {
          setSkippedIds((prev) => new Set(prev).add(current.shopifyProductId));
        }
      } else {
        setSkippedIds((prev) => new Set(prev).add(current.shopifyProductId));
      }
    } catch (err) {
      setLimitMessage(
        err instanceof Error
          ? err.message
          : "You can save up to ten dresses. Remove one to save another.",
      );
    } finally {
      setBusy(false);
      setOffsetX(0);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (busy || !current) return;
    startX.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffsetX(e.clientX - startX.current);
  }

  async function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (offsetX > 120) await decide("right");
    else if (offsetX < -120) await decide("left");
    else setOffsetX(0);
  }

  const rotation = offsetX / 28;
  const likeOpacity = Math.min(Math.max(offsetX / 140, 0), 1);
  const skipOpacity = Math.min(Math.max(-offsetX / 140, 0), 1);

  const matchingCount = filtered.length;
  const savedInFilterCount = filtered.filter((d) =>
    favoritedIds.has(d.shopifyProductId),
  ).length;
  const remainingCount = queue.length;

  return (
    <div className="w-full space-y-5">
      {limitMessage || atSaveLimit ? (
        <p className="rounded-xl bg-[var(--blush-soft)] px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-[var(--blush)]">
          {limitMessage ||
            "You can save up to ten dresses. Remove one to save another."}
        </p>
      ) : null}

      {/* Same content width as Favorites: filters + photo fill the band */}
      <div className="grid w-full items-stretch gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        {/* Filters */}
        <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h3 className="text-base font-semibold uppercase tracking-[0.1em] text-[var(--ink)]">
              Filters
            </h3>
            {selectedFilters.size > 0 || searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedFilters(new Set());
                  setSearchQuery("");
                }}
                className="text-sm text-[var(--ink)] underline"
              >
                Clear
              </button>
            ) : null}
          </div>

          <p className="mb-4 shrink-0 text-sm font-medium text-[var(--ink)]">
            {matchingCount} matching · {savedInFilterCount} saved ·{" "}
            {remainingCount} left
          </p>

          <button
            type="button"
            onClick={() => setShowStyleReference(true)}
            className="mb-4 w-full shrink-0 rounded-xl bg-[var(--blush-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--blush)] transition hover:bg-[var(--blush)]"
          >
            Explore dress styles
          </button>

          <label className="mb-3 block shrink-0 space-y-1.5">
            <span className="text-sm font-medium text-[var(--ink)]">
              Dress name
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title…"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
            />
          </label>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-black/5 rounded-xl ring-1 ring-black/5">
              {CLIENT_FILTER_GROUPS.map((group) => {
                const open = openSectionId === group.id;
                const count = selectedCountForGroup(group.id);
                return (
                  <div
                    key={group.id}
                    className="bg-white first:rounded-t-xl last:rounded-b-xl"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(group.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {group.label}
                        {count > 0 ? (
                          <span className="ml-1.5 rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-xs font-medium text-white">
                            {count}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-base text-[var(--muted)]" aria-hidden>
                        {open ? "−" : "+"}
                      </span>
                    </button>
                    {open ? (
                      <div className="space-y-2 px-3 pb-3">
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((option) => {
                            const active = selectedFilters.has(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleFilter(option.id)}
                                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                  active
                                    ? "bg-[var(--ink)] text-white"
                                    : "bg-[var(--blush-soft)] text-[var(--ink)] ring-1 ring-black/10"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Dress column — bordered panel, matched height, centered title + full image */}
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          {!current ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {filtered.length === 0
                    ? "No dresses match"
                    : "No dresses left in this deck"}
                </p>
                <p className="mt-2 text-[var(--muted)]">
                  {filtered.length === 0
                    ? "Try a different search or clear filters."
                    : hasSearch
                      ? "Matching dresses may already be skipped. Clear search to keep browsing."
                      : "Scroll down to review Favorites, or adjust filters."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
              <div className="flex w-full max-w-[min(100%,calc(min(70vh,36rem)*3/4))] items-start justify-center gap-2">
                <h3 className="min-w-0 text-center font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-[1.65rem]">
                  {current.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--blush-soft)] text-[var(--ink)] ring-1 ring-[var(--blush)] transition hover:bg-[var(--blush)]"
                  aria-label={`View description for ${current.title}`}
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
              </div>

              <div className="flex w-full flex-1 items-center justify-center">
                <div
                  className="relative w-full touch-none select-none"
                  style={{
                    maxWidth: "min(100%, calc(min(70vh, 36rem) * 3 / 4))",
                    aspectRatio: "3 / 4",
                  }}
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide("left")}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white px-3 py-3 text-sm font-semibold text-[var(--ink)] shadow-md ring-1 ring-black/10 disabled:opacity-50 sm:left-3 sm:px-4"
                  >
                    Skip
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => decide("right")}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-[var(--ink)] px-3 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50 sm:right-3 sm:px-4"
                  >
                    {currentAlreadySaved ? "Next" : "Save"}
                  </button>

                  <div
                    className="absolute inset-0 overflow-hidden rounded-3xl bg-[#f3f3f3] shadow-xl ring-1 ring-black/10"
                    style={{
                      transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
                      transition: dragging ? "none" : "transform 180ms ease",
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    {activePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activePhoto}
                        alt={current.title}
                        className="h-full w-full object-contain object-top"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--muted)]">
                        No image
                      </div>
                    )}

                    {currentAlreadySaved ? (
                      <div
                        className="pointer-events-none absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5"
                        aria-label="Saved to favorites"
                        title="Saved to favorites"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5 fill-[var(--blush)]"
                          aria-hidden
                        >
                          <path
                            d="M12 21s-6.7-4.35-9.33-7.6C.8 11.2.5 8.3 2.2 6.4 3.7 4.7 6.2 4.5 8 5.8c.7.5 1.3 1.2 1.8 2 .5-.8 1.1-1.5 1.8-2 1.8-1.3 4.3-1.1 5.8.6 1.7 1.9 1.4 4.8-.47 6.99C18.7 16.65 12 21 12 21z"
                            stroke="var(--ink)"
                            strokeWidth="1"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : null}

                    {hasMorePhotos ? (
                      <div
                        className="absolute bottom-4 right-4 z-10"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <MorePhotosControl
                          variant="deck"
                          index={imageIndex}
                          count={photos.length}
                          onPrev={() =>
                            setImageIndex(
                              (i) => (i - 1 + photos.length) % photos.length,
                            )
                          }
                          onNext={() =>
                            setImageIndex((i) => (i + 1) % photos.length)
                          }
                        />
                      </div>
                    ) : null}

                    <div
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ opacity: skipOpacity }}
                    >
                      Skip
                    </div>
                    <div
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--blush)] px-2 py-1 text-xs font-bold uppercase tracking-wider text-[var(--blush)]"
                      style={{ opacity: likeOpacity }}
                    >
                      {currentAlreadySaved ? "Next" : "Save"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetails && current ? (
        <DressDetailsDrawer
          title={current.title}
          descriptionHtml={current.descriptionHtml}
          shopifyProductId={current.shopifyProductId}
          productUrl={current.productUrl}
          onClose={() => setShowDetails(false)}
        />
      ) : null}

      {showStyleReference ? (
        <StyleReference
          dresses={dresses}
          selectedFilters={selectedFilters}
          onApplyFilter={applyStyleReferenceFilter}
          onClose={() => setShowStyleReference(false)}
        />
      ) : null}
    </div>
  );
}
