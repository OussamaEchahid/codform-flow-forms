# Shopify App Scopes and Justification

The app requests the following scopes (from shopify.app.toml):

- write_products, read_products
  - Needed to create draft products or update metadata used by the COD form and upsell logic.
- read_orders, write_orders
  - Required to create and manage COD orders submitted via the form and to sync status.
- read_themes
  - Read-only access to detect current theme blocks where the form is injected and to verify extension install.
- read_content, write_content
  - Used by the theme extension snippet insertion and content blocks to render the embedded form.
- write_pixels, read_customer_events
  - Required for the web pixel extension to track conversions and attribution for COD submissions.

Notes:
- We keep scopes to the minimal set necessary for core functionality (rendering the COD form, storing orders, tracking conversions).
- No customer read/write scopes are requested; customer data is handled via order creation only.

Security:
- All secrets are stored as Supabase Function Secrets. No service keys or Shopify secrets are committed to the repository.
- Webhooks for app/uninstalled and GDPR topics are configured and verified by the `shopify-webhooks-inspect` function.
