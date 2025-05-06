
# تحديث مسارات التطبيق

يرجى إضافة المسار التالي إلى ملف توجيه التطبيق (App.tsx أو أي ملف آخر يحتوي على التوجيه):

```jsx
<Route path="/shopify-connect" element={<ShopifyConnect />} />
```

وتأكد من استيراد صفحة ShopifyConnect:

```jsx
import ShopifyConnect from '@/pages/ShopifyConnect';
```
