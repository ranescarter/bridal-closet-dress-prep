import { NextResponse } from "next/server";
import {
  requireClientSession,
  SessionAccessError,
  touchSession,
} from "@/lib/session-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = (await request.json()) as {
      shopifyProductId?: string;
      title?: string;
      handle?: string;
      imageUrl?: string | null;
      productUrl?: string | null;
      descriptionHtml?: string | null;
    };

    if (!body.shopifyProductId || !body.title) {
      return NextResponse.json({ error: "Missing product fields" }, { status: 400 });
    }

    const session = await requireClientSession(token);
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("dress_prep_favorites")
      .upsert(
        {
          session_id: session.id,
          shopify_product_id: body.shopifyProductId,
          title: body.title,
          handle: body.handle || null,
          image_url: body.imageUrl || null,
          product_url: body.productUrl || null,
          description_html: body.descriptionHtml || null,
        },
        { onConflict: "session_id,shopify_product_id" },
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await touchSession(session.id);

    return NextResponse.json({ favorite: data });
  } catch (error) {
    if (error instanceof SessionAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Save favorite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const shopifyProductId = searchParams.get("shopifyProductId");

    if (!shopifyProductId) {
      return NextResponse.json({ error: "shopifyProductId required" }, { status: 400 });
    }

    const session = await requireClientSession(token);
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
      .from("dress_prep_favorites")
      .delete()
      .eq("session_id", session.id)
      .eq("shopify_product_id", shopifyProductId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await touchSession(session.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SessionAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Remove favorite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
