/**
 * Curated client filters from Gowns In Store tag research.
 * Each option matches one or more real Shopify tags (case-insensitive).
 */
export type FilterOption = {
  id: string;
  label: string;
  /** Tag substrings / exact names that count as a match */
  matchTags: string[];
};

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
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
        id: "maggie-sottero",
        label: "Maggie Sottero",
        matchTags: ["maggie sottero"],
      },
      {
        id: "rebecca-ingram",
        label: "Rebecca Ingram",
        matchTags: ["rebecca ingram"],
      },
      {
        id: "sottero-midgley",
        label: "Sottero & Midgley",
        matchTags: ["sottero and midgley", "sottero & midgley"],
      },
      {
        id: "mon-cheri",
        label: "Mon Cheri",
        matchTags: ["mon cheri"],
      },
      {
        id: "bridal-closet",
        label: "Bridal Closet",
        matchTags: ["bridal closet"],
      },
      {
        id: "ariamo",
        label: "Ariamo",
        matchTags: ["ariamo"],
      },
    ],
  },
]);

function sortFilterGroups(groups: FilterGroup[]): FilterGroup[] {
  return [...groups]
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
    .map((group) => ({
      ...group,
      options: [...group.options].sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    }));
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/^[-–—]+\s*/, "");
}

export function dressMatchesFilters(
  tags: string[],
  selectedIds: Set<string>,
): boolean {
  if (selectedIds.size === 0) return true;

  const normalized = tags.map(normalizeTag);
  const allOptions = CLIENT_FILTER_GROUPS.flatMap((g) => g.options);

  for (const id of selectedIds) {
    const option = allOptions.find((o) => o.id === id);
    if (!option) continue;
    const ok = option.matchTags.some((needle) => {
      const n = needle.toLowerCase();
      return normalized.some((tag) => tag === n || tag.includes(n));
    });
    if (!ok) return false;
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
