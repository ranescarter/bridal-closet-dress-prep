# Bridal Closet — Dress Prep

Magic-link app for in-store appointment clients to swipe **Gowns In Store** favorites before their visit.

## Run locally

```bash
cd "Bridal Closet/dating_app"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/staff`.

| Route | Who |
| --- | --- |
| `/staff` | Create session (name, appointment) → copy client + staff links |
| `/s/[client_token]` | Client: swipe + edit favorites |
| `/s/[staff_token]` | Staff: read-only session + favorites |

## MVP

- Shopify Admin API (Client ID/Secret → short-lived token)
- Collection handle: `gowns-in-store` (CDN image URLs only)
- Supabase: `dress_prep_sessions`, `dress_prep_favorites`
- Live favorites (no Done button)
- No n8n for MVP

## Env (`.env.local`)

```
SHOPIFY_STORE_DOMAIN=mybridalcloset-dev.myshopify.com
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
SHOPIFY_COLLECTION_HANDLE=gowns-in-store
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STAFF_PASSWORD=...
```

## Security

- **Browser** never talks to Supabase directly — only through `/api/*` routes.
- **`SUPABASE_SERVICE_ROLE_KEY`** is server-only (never `NEXT_PUBLIC_`). API routes use it after checking tokens.
- **Dress prep tables** block direct anon/authenticated access via RLS. Bride/family links are token-scoped in the API.
- **Family links** never receive the bride `client_token` in API responses.
- **`STAFF_PASSWORD`** protects `/staff` and `/api/sessions` (create, list, edit, delete).

## Later

- Bridal Live SMS template

## Smoke test (2026-07-15)

- Shopify returned 232 active Gowns In Store products
- Create session → save favorite → staff token sees favorite
