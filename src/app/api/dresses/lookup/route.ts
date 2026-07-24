import { NextResponse } from "next/server";
import { fetchShopifyProductByInput } from "@/lib/shopify";
import { serverError } from "@/lib/http";
import { requireStaffAuth } from "@/lib/staff-auth";

/** Staff: resolve a Shopify admin/storefront product URL (or id) to a dress card. */
export async function POST(request: Request) {
  const unauthorized = await requireStaffAuth();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as { url?: string };
    const url = (body.url || "").trim();
    if (!url) {
      return NextResponse.json(
        { error: "Paste a Shopify product link." },
        { status: 400 },
      );
    }

    const dress = await fetchShopifyProductByInput(url);
    if (!dress) {
      return NextResponse.json(
        { error: "No Shopify product found for that link." },
        { status: 404 },
      );
    }

    return NextResponse.json({ dress });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not look up product";
    if (
      message.includes("Paste a Shopify") ||
      message.includes("product link")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return serverError("Could not look up product");
  }
}
