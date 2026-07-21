"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CLIENT_FILTER_GROUPS,
  dressMatchesFilters,
  type FilterOption,
} from "@/lib/filters";
import { STYLE_REFERENCE_SECTIONS } from "@/lib/style-reference";
import type { DressCard } from "@/lib/types";

type Props = {
  dresses: DressCard[];
  selectedFilters: Set<string>;
  onApplyFilter: (filterId: string) => void;
  onClose: () => void;
};

const FILTER_OPTIONS = new Map<string, FilterOption>(
  CLIENT_FILTER_GROUPS.flatMap((group) =>
    group.options.map((option) => [option.id, option] as const),
  ),
);

function imageFor(dress: DressCard | undefined) {
  return dress?.imageUrls[0] ?? dress?.imageUrl ?? null;
}

export function StyleReference({
  dresses,
  selectedFilters,
  onApplyFilter,
  onClose,
}: Props) {
  const [activeSectionId, setActiveSectionId] = useState(
    STYLE_REFERENCE_SECTIONS[0].id,
  );
  const [exampleIndexByFilter, setExampleIndexByFilter] = useState<
    Record<string, number>
  >({});
  const activeSection =
    STYLE_REFERENCE_SECTIONS.find((section) => section.id === activeSectionId) ??
    STYLE_REFERENCE_SECTIONS[0];

  const exampleDressesByFilter = useMemo(() => {
    const examples = new Map<string, DressCard[]>();
    for (const section of STYLE_REFERENCE_SECTIONS) {
      for (const item of section.items) {
        const matches = dresses.filter(
          (dress) =>
            imageFor(dress) &&
            dressMatchesFilters(
              dress.tags ?? [],
              new Set([item.filterId]),
              dress.priceRangeId,
              dress.vendor,
            ),
        );
        if (matches.length) examples.set(item.filterId, matches);
      }
    }
    return examples;
  }, [dresses]);

  function showNextExample(filterId: string, exampleCount: number) {
    setExampleIndexByFilter((previous) => ({
      ...previous,
      [filterId]: ((previous[filterId] ?? 0) + 1) % exampleCount,
    }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/45 sm:items-center sm:justify-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-reference-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper)] shadow-2xl sm:h-[min(90vh,58rem)] sm:max-w-6xl sm:rounded-3xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--blush)] px-4 py-4 sm:px-7 sm:py-5">
          <div>
            <h2
              id="style-reference-title"
              className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl"
            >
              Explore dress styles
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)] sm:text-base">
              Browse examples or use one to filter the dresses. Nothing here is
              saved.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--blush-soft)] text-2xl leading-none text-[var(--ink)] ring-1 ring-black/5"
            aria-label="Close style reference"
          >
            ×
          </button>
        </header>

        <nav
          className="flex shrink-0 gap-2 overflow-x-auto border-b border-black/5 px-4 py-3 sm:px-7"
          aria-label="Style categories"
        >
          {STYLE_REFERENCE_SECTIONS.map((section) => {
            const active = section.id === activeSection.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "bg-[var(--blush-soft)] text-[var(--ink)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 max-w-3xl">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {activeSection.label}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)] sm:text-base">
              {activeSection.introduction}
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSection.items.map((item) => {
              const option = FILTER_OPTIONS.get(item.filterId);
              if (!option) return null;

              const exampleDresses =
                exampleDressesByFilter.get(item.filterId) ?? [];
              const exampleIndex =
                (exampleIndexByFilter[item.filterId] ?? 0) %
                Math.max(exampleDresses.length, 1);
              const exampleDress = exampleDresses[exampleIndex];
              const imageUrl = imageFor(exampleDress);
              const selected = selectedFilters.has(item.filterId);

              return (
                <li
                  key={item.filterId}
                  className={`overflow-hidden rounded-2xl bg-white ${
                    selected
                      ? "ring-2 ring-[var(--blush)]"
                      : "ring-1 ring-black/10"
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--blush-soft)]">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={`${option.label} example`}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 text-center text-sm text-[var(--muted)]">
                        No tagged example is currently available.
                      </div>
                    )}
                    {exampleDresses.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          showNextExample(
                            item.filterId,
                            exampleDresses.length,
                          )
                        }
                        className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm"
                        aria-label={`Show another ${option.label} example`}
                      >
                        More examples · {exampleIndex + 1}/
                        {exampleDresses.length}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex min-h-44 flex-col p-4">
                    <h4 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                      {option.label}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                    {exampleDress ? (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Example:{" "}
                        {exampleDress.productUrl ? (
                          <a
                            href={exampleDress.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--ink)] underline"
                          >
                            {exampleDress.title}
                          </a>
                        ) : (
                          exampleDress.title
                        )}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!exampleDress}
                      onClick={() => onApplyFilter(item.filterId)}
                      className={`mt-auto w-full rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "bg-[var(--blush-soft)] text-[var(--ink)] ring-1 ring-[var(--blush)]"
                          : "bg-[var(--blush)] text-[var(--ink)] hover:bg-[var(--blush-soft)]"
                      }`}
                    >
                      {selected ? "Filter selected" : "Show dresses like this"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
