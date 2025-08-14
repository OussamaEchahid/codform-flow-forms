-- إضافة webhooks GDPR المطلوبة للموافقة على التطبيق

-- إدراج webhook customers/data_request
INSERT INTO webhooks.subscriptions (
  topics,
  uri,
  api_version
) VALUES (
  '["customers/data_request"]',
  '/webhooks/customers/data_request',
  '2025-04'
) ON CONFLICT DO NOTHING;

-- إدراج webhook customers/redact
INSERT INTO webhooks.subscriptions (
  topics,
  uri,
  api_version
) VALUES (
  '["customers/redact"]',
  '/webhooks/customers/redact',
  '2025-04'
) ON CONFLICT DO NOTHING;

-- إدراج webhook shop/redact
INSERT INTO webhooks.subscriptions (
  topics,
  uri,
  api_version
) VALUES (
  '["shop/redact"]',
  '/webhooks/shop/redact',
  '2025-04'
) ON CONFLICT DO NOTHING;