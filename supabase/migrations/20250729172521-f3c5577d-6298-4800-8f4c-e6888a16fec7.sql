-- إنشاء نموذج تجريبي للمتجر bestform-app.myshopify.com
INSERT INTO public.forms (
  id,
  title,
  description,
  data,
  is_published,
  shop_id,
  user_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'نموذج تجريبي - طلب منتج',
  'نموذج لجمع بيانات العملاء لطلب المنتجات',
  '[{
    "id": "1",
    "title": "معلومات العميل",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "الاسم الكامل",
        "placeholder": "أدخل اسمك الكامل",
        "required": true,
        "icon": "user"
      },
      {
        "id": "phone",
        "type": "phone",
        "label": "رقم الهاتف",
        "placeholder": "أدخل رقم هاتفك",
        "required": true,
        "icon": "phone"
      },
      {
        "id": "address",
        "type": "textarea",
        "label": "العنوان",
        "placeholder": "أدخل عنوانك بالتفصيل",
        "required": true
      },
      {
        "id": "submit",
        "type": "submit",
        "label": "إرسال الطلب",
        "icon": "shopping-cart",
        "style": {
          "backgroundColor": "#9b87f5",
          "color": "#ffffff",
          "showIcon": true
        }
      }
    ]
  }]'::jsonb,
  true,
  'bestform-app.myshopify.com',
  '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
  now(),
  now()
);

-- إنشاء نموذج آخر غير منشور
INSERT INTO public.forms (
  id,
  title,
  description,
  data,
  is_published,
  shop_id,
  user_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'نموذج اتصال - مسودة',
  'نموذج للتواصل مع العملاء (قيد التطوير)',
  '[{
    "id": "1",
    "title": "نموذج التواصل",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "اسمك",
        "placeholder": "أدخل اسمك",
        "required": true
      },
      {
        "id": "email",
        "type": "text",
        "label": "البريد الإلكتروني",
        "placeholder": "أدخل بريدك الإلكتروني",
        "required": true
      },
      {
        "id": "message",
        "type": "textarea",
        "label": "رسالتك",
        "placeholder": "اكتب رسالتك هنا",
        "required": true
      }
    ]
  }]'::jsonb,
  false,
  'bestform-app.myshopify.com',
  '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
  now(),
  now()
);