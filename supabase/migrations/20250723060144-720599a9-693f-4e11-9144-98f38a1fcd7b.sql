-- إنشاء نموذج أساسي للمنتج
INSERT INTO public.forms (
  id, 
  title, 
  description, 
  data, 
  is_published, 
  user_id, 
  shop_id
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  'نموذج طلب المنتج',
  'نموذج لطلب منتج Selling Plans Ski Wax',
  '[
    {
      "id": "step1",
      "title": "معلومات الطلب",
      "fields": [
        {
          "id": "name",
          "type": "text",
          "label": "الاسم الكامل",
          "required": true,
          "placeholder": "أدخل اسمك الكامل"
        },
        {
          "id": "phone",
          "type": "tel",
          "label": "رقم الهاتف",
          "required": true,
          "placeholder": "رقم الهاتف"
        },
        {
          "id": "quantity",
          "type": "number",
          "label": "الكمية",
          "required": true,
          "min": 1,
          "defaultValue": 1
        },
        {
          "id": "submit",
          "type": "submit",
          "label": "تأكيد الطلب",
          "style": {
            "backgroundColor": "#000000",
            "color": "#ffffff"
          }
        }
      ]
    }
  ]'::jsonb,
  true,
  '12345678-1234-1234-1234-123456789012'::uuid,
  '9lsdqy1hqh8pky5c-64036208742.shopifypreview.com'
);

-- ربط النموذج بالمنتج
INSERT INTO public.shopify_product_settings (
  form_id,
  product_id, 
  shop_id,
  enabled
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  '7597766344806',
  '9lsdqy1hqh8pky5c-64036208742.shopifypreview.com',
  true
);

-- إضافة عروض الكمية
INSERT INTO public.quantity_offers (
  form_id,
  product_id,
  shop_id,
  offers,
  position,
  enabled
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  '7597766344806',
  '9lsdqy1hqh8pky5c-64036208742.shopifypreview.com',
  '[
    {
      "quantity": 1,
      "price": 24.95,
      "originalPrice": 24.95,
      "discount": 0,
      "label": "One-time Purchase"
    },
    {
      "quantity": 1,
      "price": 21.21,
      "originalPrice": 24.95,
      "discount": 15,
      "label": "Subscription (Save 15%)"
    },
    {
      "quantity": 1,
      "price": 19.96,
      "originalPrice": 24.95,
      "discount": 20,
      "label": "Prepaid (Save 20%)"
    }
  ]'::jsonb,
  'before_form',
  true
);