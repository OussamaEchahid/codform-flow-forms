
# دليل الاتصال بـ Shopify للنماذج

هذا الدليل يوثق الطريقة الصحيحة للاتصال بمتاجر Shopify وعرض النماذج فيها. الهدف هو توفير مرجع دقيق للتطوير المستقبلي.

## نظرة عامة على الهيكل

النظام مكون من عدة طبقات:

1. **طبقة واجهة المستخدم (UI)**: مكونات React التي تتعامل مع المستخدم
2. **طبقة الخدمات (Services)**: خدمات تدير منطق الأعمال
3. **طبقة البيانات (Data)**: تخزين البيانات في Supabase وتخزين محلي
4. **وظائف الحافة (Edge Functions)**: وظائف Supabase Edge لتنفيذ منطق الخادم بشكل آمن

## تدفق عملية الاتصال

### 1. بداية الاتصال
- المستخدم يدخل نطاق متجر Shopify في مكون `ShopifyConnection` (`src/components/shopify/ShopifyConnection.tsx`)
- تنظيف ورموز placeholder من قاعدة البيانات عند تحميل الصفحة باستخدام `shopifyConnectionService.cleanupPlaceholderTokens()`
- يتم التحقق من حالة الاتصال الحالية باستخدام `checkConnectionStatus()`

### 2. طلب المصادقة
- مكون الاتصال يستدعي دالة `connectStore()` لبدء تدفق OAuth
- يستدعي `shopifySupabase.functions.invoke('shopify-auth')` مع نطاق المتجر
- وظيفة `shopify-auth` تنشئ رابط مصادقة OAuth وترجع عنوان URL للتوجيه

### 3. إعادة التوجيه إلى Shopify
- المتصفح يوجه المستخدم إلى صفحة مصادقة Shopify
- المستخدم يوافق على الصلاحيات المطلوبة
- Shopify يعيد توجيه المستخدم إلى عنوان الاستدعاء المحدد مع رمز المصادقة

### 4. معالجة الاستدعاء
- يتم توجيه المستخدم إلى `ShopifyRedirect` أو `ShopifyCallback`
- مكون `ShopifyCallback` يستخرج رمز المصادقة ومعلمات الطلب
- يستدعي `shopifySupabase.functions.invoke('shopify-callback')` لتبادل الرمز برمز الوصول
- وظيفة `shopify-callback` تتفاعل مع API الخاص بـ Shopify للحصول على رمز الوصول

### 5. تخزين بيانات الاتصال
- رمز الوصول يتم تخزينه في قاعدة البيانات من خلال وظيفة الحافة
- معلومات المتجر والحالة النشطة يتم تحديثها في LocalStorage
- مدير الاتصال `shopifyConnectionManager` يقوم بتحديث حالة المتجر

### 6. استخدام الاتصال
- `useShopify` hook يستخدم الاتصال لاسترداد معلومات المتجر والمنتجات
- `syncFormWithShopify` يستخدم الاتصال لمزامنة النماذج مع المتجر
- إذا فشل الاتصال، يتم استخدام وضع "failsafe" لتخزين المزامنات المعلقة

## البيانات والتخزين

### التخزين المحلي (LocalStorage)

المفاتيح الرئيسية المستخدمة:
- `shopify_store`: نطاق المتجر المتصل
- `shopify_connected`: حالة الاتصال (`true` أو `false`)
- `shopify_last_url_shop`: آخر متجر تم إدخاله في رابط URL
- `pending_form_syncs`: قائمة النماذج المعلقة للمزامنة عند استعادة الاتصال
- `shopify_failsafe`: وضع الأمان لاستعادة الاتصال

### قاعدة البيانات (Supabase)

الجداول الرئيسية:
- `shopify_stores`: تخزين معلومات متاجر Shopify والرموز
- `shopify_auth`: تخزين حالات المصادقة المؤقتة
- `shopify_product_settings`: إعدادات منتجات Shopify المرتبطة بالنماذج
- `forms`: النماذج مع حقل `shop_id` للربط بمتجر

## وظائف الحافة (Edge Functions)

### shopify-auth
مسار: `supabase/functions/shopify-auth/index.ts`
الوظيفة: إنشاء رابط مصادقة OAuth لمتاجر Shopify وتخزين حالة المصادقة.

### shopify-callback
مسار: `supabase/functions/shopify-callback/index.ts`
الوظيفة: معالجة استدعاء OAuth من Shopify والحصول على رمز وصول دائم.

### shopify-sync-form
مسار: `supabase/functions/shopify-sync-form/index.ts`
الوظيفة: مزامنة نموذج مع متجر Shopify وتحديث إعدادات المنتج.

### shopify-test-connection
مسار: `supabase/functions/shopify-test-connection/index.ts`
الوظيفة: اختبار صلاحية رمز الوصول لمتجر Shopify.

### shopify-products
مسار: `supabase/functions/shopify-products/index.ts`
الوظيفة: استرداد قائمة المنتجات من متجر Shopify.

## خدمات إدارة الاتصال

### ShopifyConnectionService
مسار: `src/services/ShopifyConnectionService.ts`
الوظيفة: إدارة اتصالات Shopify وتزامن البيانات بين قاعدة البيانات والتخزين المحلي.

مسؤوليات رئيسية:
- الحصول على رمز الوصول (`getAccessToken`)
- التحقق من صلاحية الرمز (`isTokenValid`)
- تنظيف رموز placeholder (`cleanupPlaceholderTokens`)
- مزامنة المتجر مع قاعدة البيانات (`syncStoreToDatabase`)
- إعادة تعيين حالة الاتصال (`forceResetConnection`)

### ShopifyConnectionManager
مسار: `src/lib/shopify/connection-manager.ts`
الوظيفة: إدارة حالة اتصال متاجر Shopify في التخزين المحلي.

مسؤوليات رئيسية:
- إضافة/تحديث متاجر (`addOrUpdateStore`)
- الحصول على المتجر النشط (`getActiveStore`)
- إدارة قائمة المتاجر (`getAllStores`, `clearAllStores`)
- اكتشاف وإصلاح حلقات الاتصال (`isInConnectionLoop`, `resetLoopDetection`)
- التحقق من اتساق حالة الاتصال (`validateConnectionState`)

## Hooks وتكامل React

### useShopify
مسار: `src/hooks/useShopify.ts`
الوظيفة: واجهة React للتفاعل مع خدمات Shopify.

وظائف رئيسية:
- اختبار الاتصال (`testConnection`)
- تحميل المنتجات (`loadProducts`)
- مزامنة النماذج (`syncForm`, `syncFormWithShopify`)
- إعادة مزامنة النماذج المعلقة (`resyncPendingForms`)
- وضع الأمان للاستعادة (`toggleFailSafeMode`)

## آلية استعادة الأخطاء

النظام يحتوي على عدة آليات للتعافي من أخطاء الاتصال:

1. **تنظيف الرموز المؤقتة**: `cleanupPlaceholderTokens` لإزالة رموز غير صالحة
2. **اكتشاف حلقات الاتصال**: `isInConnectionLoop` للكشف عن محاولات اتصال متكررة
3. **وضع الأمان**: يتيح استمرار العمل مع تخزين المزامنات لإعادة المحاولة لاحقًا
4. **إعادة تعيين قوية**: `forceResetConnection` لإعادة تعيين كاملة لحالة الاتصال

## أفضل الممارسات

1. **دائمًا تحقق من صلاحية رموز الوصول** قبل استخدامها للعمليات
2. **نظف رموز placeholder** عند بدء واجهة المستخدم لتجنب محاولات الاتصال الفاشلة
3. **استخدم آلية إعادة المحاولة** للعمليات مثل اختبار الاتصال
4. **تخزين المزامنات المعلقة** للتعافي من انقطاع الاتصال
5. **تسجيل الخطوات الرئيسية** لتسهيل تتبع المشاكل
6. **تجنب حلقات إعادة التوجيه** بكشف ومعالجة حلقات الاتصال
7. **التحقق من اتساق حالة الاتصال** بين مختلف وسائل التخزين

## الملفات الرئيسية

1. **مكونات واجهة المستخدم**:
   - `src/components/shopify/ShopifyConnection.tsx`: مكون لإدارة اتصال المتجر
   - `src/pages/ShopifyConnect.tsx`: صفحة الاتصال بمتجر Shopify
   - `src/pages/ShopifyRedirect.tsx`: صفحة معالجة إعادة التوجيه من Shopify
   - `src/pages/api/shopify-callback.tsx`: معالج استجابة المصادقة

2. **وظائف الحافة**:
   - `supabase/functions/shopify-auth/index.ts`: وظيفة بدء المصادقة
   - `supabase/functions/shopify-callback/index.ts`: وظيفة معالجة المصادقة
   - `supabase/functions/shopify-sync-form/index.ts`: وظيفة مزامنة النماذج

3. **خدمات وهوك**:
   - `src/services/ShopifyConnectionService.ts`: خدمة إدارة اتصال Shopify
   - `src/lib/shopify/connection-manager.ts`: مدير حالة الاتصال
   - `src/hooks/useShopify.ts`: واجهة React لإدارة اتصال Shopify

## الخلاصة

اتباع هذه الهيكلية والإجراءات يساعد على ضمان اتصال موثوق وقوي بمتاجر Shopify وتسهيل عملية مزامنة النماذج مع المتاجر. يجب الحفاظ على هذه الهيكلية عند إنجاز أجزاء جديدة من النظام لضمان التناسق والاستقرار.

