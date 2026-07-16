import { NextResponse } from "next/server";
import { fetchGownsInStore } from "@/lib/shopify";

export async function GET() {
  try {
    const dresses = await fetchGownsInStore();
    return NextResponse.json({ dresses, count: dresses.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Shopify fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
