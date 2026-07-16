export type DressCard = {
  shopifyProductId: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  imageUrls: string[];
  productUrl: string | null;
  tags: string[];
  descriptionHtml: string | null;
};

export type DressPrepSession = {
  id: string;
  client_token: string;
  staff_token: string;
  client_name: string;
  appointment_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DressPrepSessionSummary = DressPrepSession & {
  favorite_count: number;
  last_updated_at: string;
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
