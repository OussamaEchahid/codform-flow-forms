
# نصائح تصحيح أخطاء اتصال Shopify

هذا الملف يحتوي على نصائح وإرشادات لتصحيح المشاكل الشائعة مع اتصال Shopify.

## مشاكل شائعة وحلولها

### 1. فشل الاتصال الأولي

**المشكلة**: المتجر لا يتصل عند إدخال النطاق.

**الحلول**:
- تأكد من صحة تنسيق نطاق المتجر (يجب أن ينتهي بـ `.myshopify.com`)
- تأكد من أن وظيفة `shopify-auth` تعمل بشكل صحيح
- تحقق من سجلات وظيفة الحافة للأخطاء

**خطوات التشخيص**:
```javascript
// تحقق من تنسيق نطاق المتجر قبل الإرسال
const normalizedShopDomain = shopDomain.trim().toLowerCase();
console.log('نطاق المتجر المنسق:', normalizedShopDomain);

// تحقق من استجابة وظيفة shopify-auth
const authResponse = await shopifySupabase.functions.invoke('shopify-auth', {
  body: { shop: normalizedShopDomain, debug: true }
});
console.log('استجابة المصادقة:', authResponse);
```

### 2. رمز الوصول غير صالح

**المشكلة**: تم استلام رمز الوصول ولكنه لا يعمل بشكل صحيح.

**الحلول**:
- تأكد من تخزين الرمز بشكل صحيح في قاعدة البيانات
- تحقق من صلاحية الرمز باستخدام `isTokenValid`
- إعادة الاتصال إذا كان الرمز منتهي الصلاحية

**خطوات التشخيص**:
```javascript
// تحقق من وجود الرمز في قاعدة البيانات
const { data } = await shopifyStores()
  .select('access_token')
  .eq('shop', shop)
  .order('updated_at', { ascending: false })
  .limit(1);
  
console.log('رمز الوصول موجود:', !!data?.[0]?.access_token);

// اختبار صلاحية الرمز
const isValid = await shopifyConnectionService.testConnection(shop);
console.log('الرمز صالح:', isValid);
```

### 3. حلقات إعادة التوجيه

**المشكلة**: المستخدم يدخل في حلقة من إعادة التوجيه أثناء عملية المصادقة.

**الحلول**:
- التحقق من اكتشاف حلقات الاتصال باستخدام `isInConnectionLoop`
- إعادة تعيين حالة الاتصال باستخدام `resetLoopDetection`
- استخدام آلية الخروج الآمن لإنهاء الحلقة

**خطوات التشخيص**:
```javascript
// تحقق من وجود حلقة اتصال
const inLoop = shopifyConnectionManager.isInConnectionLoop();
console.log('في حلقة اتصال:', inLoop);

// إذا تم اكتشاف حلقة، إعادة تعيين الحالة
if (inLoop) {
  shopifyConnectionManager.resetLoopDetection();
  shopifyConnectionManager.clearAllStores();
  console.log('تم إعادة تعيين حالة الاتصال');
}
```

### 4. تناقض بيانات الاتصال

**المشكلة**: عدم تطابق بيانات الاتصال بين قاعدة البيانات والتخزين المحلي.

**الحلول**:
- استخدام `validateConnectionState` للتحقق من اتساق البيانات
- مزامنة بيانات المتجر مع `syncStoreToDatabase`
- إعادة تعيين كاملة إذا استمرت المشكلة

**خطوات التشخيص**:
```javascript
// تحقق من اتساق حالة الاتصال
const isConsistent = shopifyConnectionManager.validateConnectionState();
console.log('حالة الاتصال متسقة:', isConsistent);

// إعادة مزامنة البيانات إذا لزم الأمر
if (!isConsistent) {
  const activeStore = shopifyConnectionManager.getActiveStore();
  if (activeStore) {
    await shopifyConnectionService.syncStoreToDatabase(activeStore, null, true);
    console.log('تمت إعادة مزامنة بيانات المتجر');
  }
}
```

### 5. مشاكل في مزامنة النماذج

**المشكلة**: النماذج لا تظهر في المتجر بعد المزامنة.

**الحلول**:
- تأكد من أن النموذج منشور (`is_published = true`)
- تحقق من صلاحية رابط المتجر بالنموذج
- تأكد من صحة إعدادات المنتج

**خطوات التشخيص**:
```javascript
// تحقق من حالة النشر للنموذج
const { data: formData } = await supabase
  .from('forms')
  .select('is_published, shop_id')
  .eq('id', formId)
  .single();
  
console.log('بيانات النموذج:', formData);

// تحقق من إعدادات المنتج
const { data: productSettings } = await supabase
  .from('shopify_product_settings')
  .select('*')
  .eq('form_id', formId);
  
console.log('عدد إعدادات المنتج:', productSettings?.length);
```

## تدفق تشخيص الأخطاء

عند مواجهة مشاكل في الاتصال، اتبع هذا التدفق المنطقي:

1. **تحقق من حالة الاتصال الحالية**:
   ```javascript
   const shopDomain = localStorage.getItem('shopify_store');
   const isConnected = localStorage.getItem('shopify_connected') === 'true';
   console.log('حالة الاتصال:', { shopDomain, isConnected });
   ```

2. **تحقق من وجود الرمز في قاعدة البيانات**:
   ```javascript
   const token = await shopifyConnectionService.getAccessToken(shopDomain);
   console.log('رمز موجود:', !!token);
   ```

3. **اختبار صلاحية الرمز**:
   ```javascript
   const isValid = await shopifyConnectionService.testConnection(shopDomain);
   console.log('الرمز صالح:', isValid);
   ```

4. **إعادة مزامنة المتجر إذا لزم الأمر**:
   ```javascript
   await shopifyConnectionService.syncStoreToDatabase(shopDomain, null, true);
   console.log('تمت إعادة مزامنة المتجر');
   ```

5. **في حالة استمرار المشكلة، إعادة تعيين كاملة**:
   ```javascript
   await shopifyConnectionService.forceResetConnection();
   console.log('تم إعادة تعيين الاتصال بالكامل');
   ```

## سجلات التصحيح المفيدة

عند تصحيح مشاكل الاتصال، تأكد من فحص:

1. **سجلات وظائف Edge في Supabase**:
   - `shopify-auth`
   - `shopify-callback`
   - `shopify-test-connection`
   - `shopify-sync-form`

2. **سجلات المتصفح (Console)**:
   - حالة الاتصال عند التحميل
   - أخطاء الشبكة عند الاتصال
   - استجابات API من Shopify

3. **قاعدة البيانات**:
   - جدول `shopify_stores` للرموز
   - جدول `shopify_auth` لحالات المصادقة
   - جدول `forms` للتحقق من حقل `shop_id`

## الخطوات الموصى بها لنشر جديد

عند تطوير ميزات جديدة تتعلق بـ Shopify، اتبع هذه الخطوات:

1. **نسخ هيكلية الاتصال الحالية** - الاحتفاظ بنفس الطبقات والمسؤوليات
2. **اختبار التغييرات المقترحة** في بيئة اختبار أولاً
3. **إضافة سجلات تصحيح كافية** للمساعدة في اكتشاف المشكلات
4. **اختبار استعادة الأخطاء** - التأكد من أن النظام يتعامل بشكل صحيح مع حالات الفشل
5. **توثيق أي تغييرات رئيسية** في هذا الدليل

