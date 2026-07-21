import { NextResponse } from "next/server";
import {
  filterDressesByIds,
  getCachedGownsInStore,
} from "@/lib/shopify";
import { serverError } from "@/lib/http";

/** Catalog list for swipe/filters — descriptions loaded on demand. */
function toListCard<T extends { descriptionHtml: string | null }>(dress: T) {
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
    const dresses =
      idList.length > 0 ? filterDressesByIds(catalog, idList) : catalog;

    return NextResponse.json(
      {
        dresses: dresses.map(toListCard),
        count: dresses.length,
      },
      {
        headers: {
          // Browser + CDN can reuse briefly; server also keeps an in-memory cache.
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return serverError("Could not load dresses");
  }
}
