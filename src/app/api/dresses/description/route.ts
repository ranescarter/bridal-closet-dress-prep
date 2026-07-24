import { NextResponse } from "next/server";
import {
  fetchShopifyProductByInput,
  getCachedGownsInStore,
} from "@/lib/shopify";
import { badRequest, serverError } from "@/lib/http";

/** Lazy description for dress details drawer (not shipped in the catalog list). */
export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return badRequest("id is required");

    const catalog = await getCachedGownsInStore();
    const fromCatalog = catalog.find((item) => item.shopifyProductId === id);
    if (fromCatalog) {
      return NextResponse.json(
        {
          shopifyProductId: fromCatalog.shopifyProductId,
          descriptionHtml: fromCatalog.descriptionHtml,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
          },
        },
      );
    }

    const fromShop = await fetchShopifyProductByInput(id);
    if (!fromShop) {
      return NextResponse.json({ error: "Dress not found" }, { status: 404 });
    }

    return NextResponse.json({
      shopifyProductId: fromShop.shopifyProductId,
      descriptionHtml: fromShop.descriptionHtml,
    });
  } catch {
    return serverError("Could not load description");
  }
}
