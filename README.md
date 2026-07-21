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
| `/s/[staff_token]` | Family: read-only session + favorites |

## Env

Copy `.env.example` → `.env.local`. Set secrets in Vercel for production — never commit `.env*`.

| Variable | Notes |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | e.g. `store.myshopify.com` |
| `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` | Dev Dashboard app credentials |
| `SHOPIFY_COLLECTION_HANDLE` | Default `gowns-in-store` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never `NEXT_PUBLIC_` |
| `STAFF_PASSWORD` | Protects `/staff` and staff APIs |
| `NEXT_PUBLIC_ADMIN_ORIGIN` | Staff host (default `admin.mybridalcloset.com`) |
| `NEXT_PUBLIC_BRIDE_ORIGIN` | Bride session host |
| `NEXT_PUBLIC_GUEST_ORIGIN` | Family session host |
| `SOCIAL_MEDIA_ORIGIN` | Optional rewrite target for social dashboard |

On localhost, bride/guest copy links use the current origin so local testing works.

## Security

- Browser never talks to Supabase directly — only through `/api/*`.
- Dress prep tables block direct anon access via RLS; APIs are token-scoped.
- Family links never receive the bride `client_token` in API responses.

## Deploy

Vercel project for this app. Custom hosts (`admin` / `bride` / `guest`) point here. Social Media UI is a separate Vercel project, rewritten under `/staff/social-media-responses` via `SOCIAL_MEDIA_ORIGIN`.
