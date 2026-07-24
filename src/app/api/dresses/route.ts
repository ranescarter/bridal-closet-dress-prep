import { NextResponse } from "next/server";
import {
  fetchShopifyProductByInput,
  filterDressesByIds,
  getCachedGownsInStore,
} from "@/lib/shopify";
import { serverError } from "@/lib/http";
import type { DressCard } from "@/lib/types";

/** Catalog list for swipe/filters — descriptions loaded on demand. */
function toListCard(dress: DressCard) {
  return { ...dress, descriptionHtml: null as string | null };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const idList = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const catalog = await getCachedGownsInStore();

    if (idList.length === 0) {
      return NextResponse.json(
        {
          dresses: catalog.map(toListCard),
          count: catalog.length,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
          },
        },
      );
    }

    const fromCatalog = filterDressesByIds(catalog, idList);
    const found = new Set(fromCatalog.map((d) => d.shopifyProductId));
    const missing = idList.filter((id) => !found.has(id));

    const extras: DressCard[] = [];
    for (const id of missing) {
      try {
        const dress = await fetchShopifyProductByInput(id);
        if (dress) extras.push(dress);
      } catch {
        // Skip ids that cannot be resolved.
      }
    }

    const dresses = [...fromCatalog, ...extras];

    return NextResponse.json(
      {
        dresses: dresses.map(toListCard),
        count: dresses.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return serverError("Could not load dresses");
  }
}
