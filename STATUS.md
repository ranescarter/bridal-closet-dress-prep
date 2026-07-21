# Dress Prep — status

## Done (MVP)

- [x] Next.js app scaffold
- [x] Shopify Client ID/Secret → access token → Gowns In Store
- [x] Supabase tables `dress_prep_sessions` + `dress_prep_favorites`
- [x] Staff dashboard (`/staff`) — create, list, edit, copy/open links, remove
- [x] Session hub with name / appointment / favorites
- [x] Client swipe UI
  - Photo-forward layout; description opens from an info icon beside the title
  - View on website kept inside the description drawer
  - Favorites use a full-width grid; description via info + drawer (no side panel)
- [x] Visual dress-style reference using live Shopify images
  - Browse silhouettes, necklines/straps, sleeves/coverage, and details
  - Filter dresses directly from a reference style
  - Cycle through matching products with “More examples”
  - Open each example on the Bridal Closet website
  - No reference activity or images stored
- [x] Family read-only link (staff_token)
- [x] Branding (logo, fonts, blush theme)
- [x] Local smoke test (232 dresses; session + favorite + staff view)

## Later

- [x] Staff page auth (shared password for `/staff` and staff API routes)
- [x] Token-scoped bride/family API access + locked-down RLS
- [x] Service role for server API database access

## Next focus

- [ ] Review and refine client filters, categories, and Shopify tag mappings