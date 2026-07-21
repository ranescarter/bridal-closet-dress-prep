import { NextResponse } from "next/server";
import { fetchGownsInStore } from "@/lib/shopify";
import { serverError } from "@/lib/http";

export async function GET() {
  try {
    const dresses = await fetchGownsInStore();
    return NextResponse.json({ dresses, count: dresses.length });
  } catch {
    return serverError("Could not load dresses");
  }
}
