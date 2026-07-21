import { NextResponse } from "next/server";

/** Parse JSON body; returns null on invalid JSON. */
export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(fallback = "Request failed") {
  return NextResponse.json({ error: fallback }, { status: 500 });
}
