# Dress Prep — status

## Done (MVP)

- [x] Next.js app scaffold
- [x] Shopify Client ID/Secret → access token → Gowns In Store
- [x] Supabase tables `dress_prep_sessions` + `dress_prep_favorites`
- [x] Staff dashboard (`/staff`) — create, list, edit, copy/open links, remove
  - Collapsible rows with favorites (dress name + vendor)
  - How these pages work help
- [x] Session hub with name / appointment / favorites
- [x] Client swipe UI
  - Photo-forward layout; description opens from an info icon beside the title
  - View on website kept inside the description drawer
  - Favorites use a full-width grid; description via info + drawer (no side panel)
  - Tap favorite photo → full-screen lightbox (side arrows = dresses; Image arrows = photos)
  - Save limit of 10; 9/10 nudge; alphabetical favorites
- [x] Visual dress-style reference using live Shopify images
- [x] Family read-only link (staff_token) + lightbox how-to copy
- [x] Branding (logo, fonts, blush theme)
  - Brand loading state (tagline + bar) while session/catalog loads
- [x] Price Range filter (banded; no raw prices in UI)
- [x] Designer filter from Shopify vendors (match vendor + tags)
- [x] Catalog load performance (server cache, slimmer payload, F&F skips full catalog)
- [x] Deck order = Shopify **Gowns In Store** collection order (manual sort; no A–Z override)
- [x] Staff page auth + token-scoped APIs + service role

## Deck order note

First dress on a new bride link follows Shopify collection order (Manual sort on Gowns In Store). Top sellers are curated in Shopify using Bridal Live data (no Bridal Live API). First photo of a dress is newest media in Shopify.

## Next focus

- [ ] **Filter Groups & Tags** — staff finishing Shopify tags; map Categories ↔ tags from the Google Sheet (from `/exports` xls) into `src/lib/filters.ts` when ready

## Deploy

- [x] Pushed to GitHub / production (`main`)
