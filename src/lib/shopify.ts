import type { DressCard } from "./types";
import { priceAmountToRangeId } from "./price-range";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const collectionHandle =
    process.env.SHOPIFY_COLLECTION_HANDLE || "gowns-in-store";

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Missing SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET",
    );
  }

  return { domain, clientId, clientSecret, collectionHandle };
}

export async function getShopifyAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const { domain, clientId, clientSecret } = getShopifyConfig();
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    errors?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        data.errors ||
        `Shopify token request failed (${res.status})`,
    );
  }

  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 86400;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };
  return data.access_token;
}

async function shopifyAdminGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { domain } = getShopifyConfig();
  const accessToken = await getShopifyAccessToken();

  const res = await fetch(`https://${domain}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (!res.ok || json.errors?.length) {
    throw new Error(
      json.errors?.map((e) => e.message).join("; ") ||
        `Shopify GraphQL failed (${res.status})`,
    );
  }

  if (!json.data) {
    throw new Error("Shopify GraphQL returned no data");
  }

  return json.data;
}

type CollectionProductsResponse = {
  collectionByHandle: {
    id: string;
    title: string;
    products: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          status: string;
          vendor: string;
          tags: string[];
          descriptionHtml: string | null;
          featuredImage: { url: string } | null;
          media: {
            nodes: Array<{
              createdAt?: string;
              image?: { url: string } | null;
            } | null>;
          };
          onlineStoreUrl: string | null;
          priceRangeV2: {
            minVariantPrice: { amount: string; currencyCode: string };
          };
        };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

export async function fetchGownsInStore(): Promise<DressCard[]> {
  const { collectionHandle } = getShopifyConfig();
  const dresses: DressCard[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: CollectionProductsResponse = await shopifyAdminGraphql(
      `
      query GownsInStore($handle: String!, $cursor: String) {
        collectionByHandle(handle: $handle) {
          id
          title
          products(first: 50, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                status
                vendor
                tags
                descriptionHtml
                featuredImage { url }
                media(first: 12) {
                  nodes {
                    ... on MediaImage {
                      createdAt
                      image { url }
                    }
                  }
                }
                onlineStoreUrl
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      `,
      { handle: collectionHandle, cursor },
    );

    if (!data.collectionByHandle) {
      throw new Error(
        `Collection not found for handle "${collectionHandle}". Check SHOPIFY_COLLECTION_HANDLE.`,
      );
    }

    for (const edge of data.collectionByHandle.products.edges) {
      const p = edge.node;
      if (p.status !== "ACTIVE") continue;

      // Newest media first (createdAt = when the image was added in Shopify).
      const mediaPhotos = (p.media?.nodes || [])
        .filter(
          (node): node is { createdAt?: string; image?: { url: string } | null } =>
            Boolean(node && node.image?.url),
        )
        .map((node) => ({
          url: node.image!.url,
          createdAt: node.createdAt || "",
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const imageUrls = mediaPhotos.map((photo) => photo.url);
      if (imageUrls.length === 0 && p.featuredImage?.url) {
        imageUrls.push(p.featuredImage.url);
      }

      const amountRaw = p.priceRangeV2?.minVariantPrice?.amount;
      const amount = amountRaw != null ? Number.parseFloat(amountRaw) : NaN;

      dresses.push({
        shopifyProductId: p.id,
        title: p.title,
        handle: p.handle,
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        productUrl: p.onlineStoreUrl,
        tags: Array.isArray(p.tags) ? p.tags : [],
        vendor: (p.vendor || "").trim() || null,
        descriptionHtml: p.descriptionHtml || null,
        priceRangeId: priceAmountToRangeId(
          Number.isFinite(amount) ? amount : null,
        ),
      });
    }

    hasNextPage = data.collectionByHandle.products.pageInfo.hasNextPage;
    cursor = data.collectionByHandle.products.pageInfo.endCursor;
  }

  return dresses;
}
