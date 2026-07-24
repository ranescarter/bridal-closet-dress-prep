"use client";

import { useEffect, useMemo, useState } from "react";
import { arrivalInputValue } from "@/lib/said-yes";
import type { DressCard, DressPrepSessionSummary } from "@/lib/types";

type DressPick = {
  shopifyProductId: string | null;
  title: string;
  handle: string | null;
  imageUrl: string | null;
  productUrl: string | null;
};

type Props = {
  session: DressPrepSessionSummary;
  catalog: DressCard[];
  catalogLoading: boolean;
  onSaved: (session: DressPrepSessionSummary) => void;
  onUnauthorized: () => void;
};

export function SaidYesStaffEditor({
  session,
  catalog,
  catalogLoading,
  onSaved,
  onUnauthorized,
}: Props) {
  const [query, setQuery] = useState("");
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [arrival, setArrival] = useState(
    arrivalInputValue(session.estimated_arrival_on),
  );
  const [dress, setDress] = useState<DressPick | null>(() =>
    session.said_yes_title || session.said_yes_shopify_product_id
      ? {
          shopifyProductId: session.said_yes_shopify_product_id,
          title: session.said_yes_title || "",
          handle: session.said_yes_handle,
          imageUrl: session.said_yes_image_url,
          productUrl: session.said_yes_product_url,
        }
      : null,
  );
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setArrival(arrivalInputValue(session.estimated_arrival_on));
    setDress(
      session.said_yes_title || session.said_yes_shopify_product_id
        ? {
            shopifyProductId: session.said_yes_shopify_product_id,
            title: session.said_yes_title || "",
            handle: session.said_yes_handle,
            imageUrl: session.said_yes_image_url,
            productUrl: session.said_yes_product_url,
          }
        : null,
    );
    setShopifyUrl("");
    setQuery("");
    setPicking(false);
    setError(null);
  }, [session.id, session.updated_at]);

  const showPicker = !dress || picking;

  const catalogHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return catalog
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.vendor || "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [catalog, query]);

  function pickFromFavorite(fav: DressPrepSessionSummary["favorites"][number]) {
    setDress({
      shopifyProductId: fav.shopify_product_id,
      title: fav.title,
      handle: fav.handle,
      imageUrl: fav.image_url,
      productUrl: fav.product_url,
    });
    setShopifyUrl("");
    setQuery("");
    setPicking(false);
  }

  function pickFromCatalog(card: DressCard) {
    setDress({
      shopifyProductId: card.shopifyProductId,
      title: card.title,
      handle: card.handle,
      imageUrl: card.imageUrl,
      productUrl: card.productUrl,
    });
    setShopifyUrl("");
    setQuery("");
    setPicking(false);
  }

  function onFavoriteSelect(value: string) {
    if (!value) return;
    const fav = session.favorites.find((f) => f.id === value);
    if (fav) pickFromFavorite(fav);
  }

  async function lookupShopifyUrl() {
    const url = shopifyUrl.trim();
    if (!url) {
      setError("Paste a Shopify product link.");
      return;
    }
    setLookingUp(true);
    setError(null);
    try {
      const res = await fetch("/api/dresses/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not look up product");
      const card = data.dress as DressCard;
      pickFromCatalog(card);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not look up product");
    } finally {
      setLookingUp(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          saidYesDress: dress
            ? {
                shopifyProductId: dress.shopifyProductId,
                title: dress.title,
                handle: dress.handle,
                imageUrl: dress.imageUrl,
                productUrl: dress.productUrl,
              }
            : null,
          estimatedArrivalOn: arrival.trim() ? arrival.trim() : null,
        }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      onSaved({
        ...session,
        ...data.session,
        favorites: session.favorites,
        favorite_count: session.favorite_count,
        last_updated_at: data.session.updated_at || session.last_updated_at,
      });
      setPicking(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-[var(--blush)]">
      <div className="bg-[var(--blush-soft)] px-3 py-2">
        <p className="text-sm font-medium text-[var(--ink)]">Selected dress</p>
        <p className="text-xs text-[var(--muted)]">
          Favorites first, then Gowns In Store. Special order? Paste a Shopify
          link. Arrival is optional.
        </p>
      </div>
      <div className="space-y-2 px-3 py-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          {!showPicker && dress ? (
            <div className="flex min-h-[42px] items-center justify-between gap-2 rounded-lg border border-black/10 bg-[var(--blush-soft)] px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--ink)]">
                  {dress.title}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPicking(true);
                    setQuery("");
                    setShopifyUrl("");
                  }}
                  className="text-xs text-[var(--ink)] underline"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDress(null);
                    setPicking(true);
                  }}
                  className="text-xs text-[var(--muted)] underline"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(session.favorites?.length ?? 0) > 0 ? (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    onFavoriteSelect(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
                  aria-label="Pick from favorites"
                >
                  <option value="">Favorites…</option>
                  {session.favorites.map((fav) => (
                    <option key={fav.id} value={fav.id}>
                      {fav.title}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="relative">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    catalogLoading
                      ? "Loading catalog…"
                      : "Search Gowns In Store…"
                  }
                  className="w-full rounded-lg border border-black/10 py-2 pl-3 pr-9 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
                  aria-autocomplete="list"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)]"
                  aria-hidden
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 4.25L6 7.75L9.5 4.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          )}
        </div>

        <label className="block shrink-0 space-y-1 text-sm lg:w-44">
          <span className="text-xs text-[var(--muted)]">Est. arrival</span>
          <input
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
          />
        </label>

        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="shrink-0 rounded-full bg-[var(--blush)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] disabled:opacity-50 lg:ml-auto"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {showPicker && catalogHits.length > 0 ? (
        <ul className="max-h-32 space-y-0.5 overflow-y-auto rounded-lg border border-black/5 text-sm">
          {catalogHits.map((card) => (
            <li key={card.shopifyProductId}>
              <button
                type="button"
                onClick={() => pickFromCatalog(card)}
                className="w-full px-3 py-1.5 text-left text-[var(--ink)] hover:bg-[var(--blush-soft)]"
              >
                {card.title}
                {card.vendor ? (
                  <span className="text-[var(--muted)]"> · {card.vendor}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showPicker ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="url"
            value={shopifyUrl}
            onChange={(e) => setShopifyUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void lookupShopifyUrl();
              }
            }}
            placeholder="Paste Shopify product link…"
            className="w-full flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
          />
          <button
            type="button"
            disabled={lookingUp}
            onClick={() => void lookupShopifyUrl()}
            className="rounded-full bg-[var(--blush-soft)] px-3 py-2 text-xs font-medium text-[var(--ink)] ring-1 ring-black/10 disabled:opacity-50"
          >
            {lookingUp ? "Looking up…" : "Use link"}
          </button>
          {dress && picking ? (
            <button
              type="button"
              onClick={() => setPicking(false)}
              className="text-xs text-[var(--muted)] underline"
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
