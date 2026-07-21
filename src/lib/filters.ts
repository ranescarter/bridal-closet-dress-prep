/**
 * Curated client filters from Gowns In Store tag research.
 * Each option matches one or more real Shopify tags (case-insensitive),
 * or a server-banded priceRangeId (never a raw dollar amount in the UI).
 *
 * Naming: in code these are "filter groups"; staff often call them "categories."
 */
import type { PriceRangeId } from "@/lib/price-range";

export type FilterOption = {
  id: string;
  label: string;
  /** Tag substrings / exact names that count as a match */
  matchTags?: string[];
  /** Matches DressCard.priceRangeId for Price Range filters */
  priceRangeId?: PriceRangeId;
};

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
};

const PRICE_RANGE_GROUP: FilterGroup = {
  id: "price-range",
  label: "Price Range",
  options: [
    {
      id: "price-1000-1499",
      label: "$1,000 – $1,499",
      priceRangeId: "1000-1499",
    },
    {
      id: "price-1500-1999",
      label: "$1,500 – $1,999",
      priceRangeId: "1500-1999",
    },
    {
      id: "price-2000-2499",
      label: "$2,000 – $2,499",
      priceRangeId: "2000-2499",
    },
    {
      id: "price-2500-plus",
      label: "$2,500+",
      priceRangeId: "2500-plus",
    },
  ],
};

export const CLIENT_FILTER_GROUPS: FilterGroup[] = sortFilterGroups([
  {
    id: "fit",
    label: "Fit",
    options: [
      {
        id: "modest",
        label: "Modest",
        matchTags: ["modest", "mon cheri modest"],
      },
      {
        id: "temple-ready",
        label: "Temple Ready",
        matchTags: ["temple ready"],
      },
    ],
  },
  {
    id: "silhouette",
    label: "Silhouette",
    options: [
      {
        id: "mermaid",
        label: "Mermaid / Fit & Flare",
        matchTags: ["fit&flare/mermaid", "fit and flare", "mermaid", "fitted"],
      },
      {
        id: "a-line",
        label: "A-line",
        matchTags: ["a-line", "a line", "aline"],
      },
      {
        id: "ball-gown",
        label: "Ball Gown",
        matchTags: ["ball gown", "ballgown"],
      },
    ],
  },
  {
    id: "details",
    label: "Details",
    options: [
      { id: "strapless", label: "Strapless", matchTags: ["strapless"] },
      { id: "long-sleeve", label: "Long Sleeve", matchTags: ["long sleeve"] },
      { id: "cap-sleeve", label: "Cap Sleeve", matchTags: ["cap sleeve"] },
      {
        id: "off-shoulder",
        label: "Off the Shoulder",
        matchTags: ["off the shoulder"],
      },
      {
        id: "spaghetti",
        label: "Thin / Spaghetti Straps",
        matchTags: ["spaghetti/thin straps", "spaghetti", "tank straps"],
      },
      { id: "lace", label: "Lace", matchTags: ["lace"] },
      {
        id: "sweetheart",
        label: "Sweetheart",
        matchTags: ["sweetheart"],
      },
      { id: "v-neck", label: "V-Neck", matchTags: ["v-neck", "deep v"] },
      { id: "corset", label: "Corset", matchTags: ["corset"] },
      { id: "slit", label: "Slit", matchTags: ["slit", "leg slit"] },
    ],
  },
  {
    id: "designer",
    label: "Designer",
    options: [
      {
        id: "ariamo",
        label: "Ariamo",
        matchTags: ["ariamo"],
      },
      {
        id: "bridal-closet",
        label: "Bridal Closet",
        matchTags: ["bridal closet"],
      },
      {
        id: "la-premiere",
        label: "La Premiere",
        matchTags: ["la premiere"],
      },
      {
        id: "maggie-sottero",
        label: "Maggie Sottero",
        matchTags: ["maggie sottero"],
      },
      {
        id: "mon-cheri",
        label: "Mon Cheri Modest",
        matchTags: ["mon cheri modest", "mon cheri"],
      },
      {
        id: "pollardi",
        label: "Pollardi",
        matchTags: ["pollardi"],
      },
      {
        id: "rebecca-ingram",
        label: "Rebecca Ingram",
        matchTags: ["rebecca ingram"],
      },
      {
        id: "sottero-midgley",
        label: "Sottero and Midgley",
        matchTags: ["sottero and midgley", "sottero & midgley"],
      },
      {
        id: "stone-collection",
        label: "Stone Collection",
        matchTags: ["stone collection"],
      },
      {
        id: "studio-levana",
        label: "Studio Levana",
        matchTags: ["studio levana"],
      },
      {
        id: "zuri",
        label: "Zuri",
        matchTags: ["zuri"],
      },
    ],
  },
  PRICE_RANGE_GROUP,
]);

function sortFilterGroups(groups: FilterGroup[]): FilterGroup[] {
  return [...groups]
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    )
    .map((group) => {
      // Keep Price Range in ascending band order (not A–Z by label).
      if (group.id === "price-range") return group;
      return {
        ...group,
        options: [...group.options].sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
        ),
      };
    });
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^[-–—]+\s*/, "");
}

function optionMatchesDress(
  option: FilterOption,
  normalizedTags: string[],
  priceRangeId: string | null | undefined,
  vendor: string | null | undefined,
): boolean {
  if (option.priceRangeId) {
    return priceRangeId === option.priceRangeId;
  }
  const matchTags = option.matchTags || [];
  const normalizedVendor = vendor ? normalizeTag(vendor) : "";
  return matchTags.some((needle) => {
    const n = needle.toLowerCase();
    if (normalizedVendor && (normalizedVendor === n || normalizedVendor.includes(n))) {
      return true;
    }
    return normalizedTags.some((tag) => tag === n || tag.includes(n));
  });
}

/**
 * Selected filters: OR within the same group, AND across groups.
 */
export function dressMatchesFilters(
  tags: string[],
  selectedIds: Set<string>,
  priceRangeId?: string | null,
  vendor?: string | null,
): boolean {
  if (selectedIds.size === 0) return true;

  const normalized = tags.map(normalizeTag);

  for (const group of CLIENT_FILTER_GROUPS) {
    const selectedInGroup = group.options.filter((o) => selectedIds.has(o.id));
    if (selectedInGroup.length === 0) continue;

    const matchesGroup = selectedInGroup.some((option) =>
      optionMatchesDress(option, normalized, priceRangeId, vendor),
    );
    if (!matchesGroup) return false;
  }

  return true;
}

/** Search by dress title (Shopify product title). */
export function dressMatchesSearch(title: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return title.toLowerCase().includes(q);
}

export function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
