export type DressCard = {
  shopifyProductId: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  imageUrls: string[];
  productUrl: string | null;
  tags: string[];
  /** Shopify product vendor (for Designer filters). */
  vendor: string | null;
  descriptionHtml: string | null;
  /**
   * Banded price for filters only — never the raw dollar amount.
   * e.g. "1000-1499" | "1500-1999" | "2000-2499" | "2500-plus" | "under-1000"
   */
  priceRangeId: string | null;
};

export type DressPrepSession = {
  id: string;
  client_token: string;
  staff_token: string;
  client_name: string;
  appointment_at: string | null;
  pinterest_url: string | null;
  pinterest_updated_at: string | null;
  said_yes_shopify_product_id: string | null;
  said_yes_title: string | null;
  said_yes_handle: string | null;
  said_yes_image_url: string | null;
  said_yes_product_url: string | null;
  estimated_arrival_on: string | null;
  created_at: string;
  updated_at: string;
};

export type DressPrepSessionSummary = DressPrepSession & {
  favorite_count: number;
  last_updated_at: string;
  favorites: Array<{
    id: string;
    title: string;
    shopify_product_id: string;
    image_url: string | null;
    product_url: string | null;
    handle: string | null;
  }>;
};

export type DressPrepFavorite = {
  id: string;
  session_id: string;
  shopify_product_id: string;
  title: string;
  handle: string | null;
  image_url: string | null;
  product_url: string | null;
  description_html: string | null;
  created_at: string;
};
