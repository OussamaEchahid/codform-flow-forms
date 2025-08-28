# Shopify App Scopes and Justification

The app requests the following scopes (from shopify.app.toml):

- read_products
  - Required to list products and show them in the app UI and associate products with forms/offers.
- write_draft_orders
  - Required to create Shopify Draft Orders from COD form submissions (we do not create final orders).
- write_pixels
  - Required by our Web Pixel Extension to register a pixel via webPixelCreate.
- read_customer_events
  - Required for end-to-end pixel management/activation inside Shopify Admin “Customer events”, ensuring smooth connection state and visibility.

Removed (not used in current app version):
- write_products (no product creation or updates)
- write_orders/read_orders (we do not create or manage final orders; we create Draft Orders only)
- read_themes (we use a Theme App Extension, no direct theme reading)
- read_content/write_content (no Content API writes)

Notes:
- We keep scopes to the minimal set necessary for core functionality (rendering the COD form, storing orders, tracking conversions).
- No customer read/write scopes are requested; customer data is handled via order creation only.

Security:
- All secrets are stored as Supabase Function Secrets. No service keys or Shopify secrets are committed to the repository.
- Webhooks for app/uninstalled and GDPR topics are configured and verified by the `shopify-webhooks-inspect` function.
