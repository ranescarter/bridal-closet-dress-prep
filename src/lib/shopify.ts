import type { DressCard } from "./types";
import { priceAmountToRangeId } from "./price-range";
import { shopifyCdnUrl } from "./dresses";

/** How many gallery images to keep per dress in the client catalog. */
const MAX_GALLERY_IMAGES = 6;
/** Server memory cache for the Active Gowns In Store catalog. */
const CATALOG_TTL_MS = 3 * 60 * 1000;

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

type CatalogCache = {
  dresses: DressCard[];
  expiresAt: number;
  promise: Promise<DressCard[]> | null;
};

let tokenCache: TokenCache | null = null;
let catalogCache: CatalogCache = {
  dresses: [],
  expiresAt: 0,
  promise: null,
};

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
                media(first: 6) {
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

      const rawUrls = mediaPhotos.map((photo) => photo.url);
      if (rawUrls.length === 0 && p.featuredImage?.url) {
        rawUrls.push(p.featuredImage.url);
      }

      const imageUrls = rawUrls
        .slice(0, MAX_GALLERY_IMAGES)
        .map((url) => shopifyCdnUrl(url, 1200) || url);

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

/**
 * Cached Active Gowns In Store catalog (shared across requests on the same
 * server instance). Concurrent callers share one in-flight Shopify fetch.
 */
export async function getCachedGownsInStore(): Promise<DressCard[]> {
  const now = Date.now();
  if (catalogCache.dresses.length > 0 && catalogCache.expiresAt > now) {
    return catalogCache.dresses;
  }

  if (catalogCache.promise) {
    return catalogCache.promise;
  }

  catalogCache.promise = fetchGownsInStore()
    .then((dresses) => {
      catalogCache = {
        dresses,
        expiresAt: Date.now() + CATALOG_TTL_MS,
        promise: null,
      };
      return dresses;
    })
    .catch((error) => {
      catalogCache.promise = null;
      throw error;
    });

  return catalogCache.promise;
}

export function filterDressesByIds(
  dresses: DressCard[],
  ids: string[],
): DressCard[] {
  if (!ids.length) return [];
  const wanted = new Set(ids);
  return dresses.filter((dress) => wanted.has(dress.shopifyProductId));
}

/**
 * Accepts admin product URLs, storefront /products/{handle} URLs, numeric ids,
 * or GraphQL GIDs. Returns a product GID and/or handle to look up.
 */
export function parseShopifyProductInput(raw: string): {
  productGid?: string;
  handle?: string;
} {
  const input = raw.trim();
  if (!input) return {};

  const gidMatch = input.match(/gid:\/\/shopify\/Product\/(\d+)/i);
  if (gidMatch) {
    return { productGid: `gid://shopify/Product/${gidMatch[1]}` };
  }

  if (/^\d+$/.test(input)) {
    return { productGid: `gid://shopify/Product/${input}` };
  }

  try {
    const url = new URL(input);
    const adminMatch = url.pathname.match(/\/products\/(\d+)(?:\/|$)/);
    if (adminMatch) {
      return { productGid: `gid://shopify/Product/${adminMatch[1]}` };
    }
    const handleMatch = url.pathname.match(/\/products\/([^/?#]+)(?:\/|$)/);
    if (handleMatch) {
      return { handle: decodeURIComponent(handleMatch[1]) };
    }
  } catch {
    // not a URL
  }

  return {};
}

type ProductByIdResponse = {
  product: {
    id: string;
    title: string;
    handle: string;
    status: string;
    vendor: string;
    descriptionHtml: string | null;
    featuredImage: { url: string } | null;
    media: {
      nodes: Array<{
        createdAt?: string;
        image?: { url: string } | null;
      } | null>;
    };
    onlineStoreUrl: string | null;
  } | null;
};

type ProductByHandleResponse = {
  productByHandle: ProductByIdResponse["product"];
};

function dressCardFromShopifyProduct(
  product: NonNullable<ProductByIdResponse["product"]>,
): DressCard {
  const mediaPhotos = (product.media?.nodes || [])
    .filter(
      (node): node is { createdAt?: string; image?: { url: string } | null } =>
        Boolean(node && node.image?.url),
    )
    .map((node) => ({
      url: node.image!.url,
      createdAt: node.createdAt || "",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const rawUrls = mediaPhotos.map((photo) => photo.url);
  if (rawUrls.length === 0 && product.featuredImage?.url) {
    rawUrls.push(product.featuredImage.url);
  }

  const imageUrls = rawUrls
    .slice(0, MAX_GALLERY_IMAGES)
    .map((url) => shopifyCdnUrl(url, 1200) || url);

  return {
    shopifyProductId: product.id,
    title: product.title,
    handle: product.handle,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    productUrl: product.onlineStoreUrl,
    tags: [],
    vendor: (product.vendor || "").trim() || null,
    descriptionHtml: product.descriptionHtml || null,
    priceRangeId: null,
  };
}

/** Look up any product in the shop (not limited to Gowns In Store). */
export async function fetchShopifyProductByInput(
  raw: string,
): Promise<DressCard | null> {
  const parsed = parseShopifyProductInput(raw);
  if (!parsed.productGid && !parsed.handle) {
    throw new Error(
      "Paste a Shopify admin product link, storefront product link, or product id.",
    );
  }

  let product: ProductByIdResponse["product"] = null;

  if (parsed.productGid) {
    const data = await shopifyAdminGraphql<ProductByIdResponse>(
      `
      query ProductById($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          status
          vendor
          descriptionHtml
          featuredImage { url }
          media(first: 6) {
            nodes {
              ... on MediaImage {
                createdAt
                image { url }
              }
            }
          }
          onlineStoreUrl
        }
      }
      `,
      { id: parsed.productGid },
    );
    product = data.product;
  } else if (parsed.handle) {
    const data = await shopifyAdminGraphql<ProductByHandleResponse>(
      `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          handle
          status
          vendor
          descriptionHtml
          featuredImage { url }
          media(first: 6) {
            nodes {
              ... on MediaImage {
                createdAt
                image { url }
              }
            }
          }
          onlineStoreUrl
        }
      }
      `,
      { handle: parsed.handle },
    );
    product = data.productByHandle;
  }

  if (!product) return null;
  return dressCardFromShopifyProduct(product);
}
