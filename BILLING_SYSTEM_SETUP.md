# 🔄 نظام إدارة الاشتراكات والفوترة

## 📋 المشاكل التي تم حلها:

### 1. **مشكلة next_billing_date = NULL**
- جميع الاشتراكات كانت تظهر `next_billing_date` كـ `NULL`
- لا يوجد تجديد تلقائي أو مراقبة لانتهاء الاشتراكات

### 2. **عدم وجود نظام إرجاع للخطة المجانية**
- عند انتهاء الاشتراك، المستخدم يبقى على نفس الخطة
- لا يتم إرجاعه تلقائياً للخطة المجانية

## 🛠️ الحلول المطبقة:

### 1. **دالة فحص الاشتراكات المنتهية**
```
supabase/functions/check-expired-subscriptions/index.ts
```
- تفحص الاشتراكات التي انتهت صلاحيتها
- تتحقق من Shopify للتأكد من حالة الاشتراك
- ترجع المستخدمين للخطة المجانية عند انتهاء الاشتراك

### 2. **دالة إصلاح تواريخ الفوترة**
```
supabase/functions/fix-billing-dates/index.ts
```
- تصلح الاشتراكات التي لا تحتوي على `next_billing_date`
- تعين تاريخ التجديد التالي (شهر من الآن)

### 3. **تحديث دالة confirm_subscription_payment**
```
supabase/migrations/20250830_fix_confirm_subscription_payment.sql
```
- تعين `next_billing_date` عند تفعيل الاشتراك
- تنسخ `requested_plan_type` إلى `plan_type`
- تمسح `requested_plan_type` بعد التفعيل

### 4. **تحديث webhook الفوترة**
```
supabase/functions/shopify-webhooks/index.ts
```
- يعين `next_billing_date` عند تفعيل الاشتراك
- يرجع للخطة المجانية عند الإلغاء
- يدير حالات الاشتراك بشكل صحيح

### 5. **مهمة مجدولة للفحص الدوري**
```
supabase/functions/scheduled-billing-check/index.ts
```
- تستدعي دوال الفحص والإصلاح
- يمكن تشغيلها يومياً عبر cron job

## 🚀 كيفية التطبيق:

### 1. **تطبيق التحديثات على قاعدة البيانات:**
```bash
# تطبيق migration الجديد
supabase db push

# أو تشغيل الملف مباشرة
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250830_fix_confirm_subscription_payment.sql
```

### 2. **نشر Edge Functions:**
```bash
# نشر جميع الدوال
supabase functions deploy check-expired-subscriptions
supabase functions deploy fix-billing-dates  
supabase functions deploy scheduled-billing-check

# أو نشر الدالة المحدثة
supabase functions deploy shopify-webhooks
```

### 3. **إصلاح البيانات الحالية:**
```bash
# إصلاح تواريخ الفوترة المفقودة
curl -X POST "https://your-project.supabase.co/functions/v1/fix-billing-dates" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# فحص الاشتراكات المنتهية
curl -X POST "https://your-project.supabase.co/functions/v1/check-expired-subscriptions" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. **إعداد Cron Job (اختياري):**
```bash
# إضافة إلى crontab للتشغيل يومياً في الساعة 2 صباحاً
0 2 * * * curl -X POST "https://your-project.supabase.co/functions/v1/scheduled-billing-check" -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📊 كيف يعمل النظام الآن:

### 1. **عند الاشتراك الجديد:**
- يتم تعيين `next_billing_date` = الآن + شهر
- حالة الاشتراك = `pending` حتى تأكيد الدفع
- عند التأكيد: `status` = `active` و `next_billing_date` محدد

### 2. **عند انتهاء الاشتراك:**
- النظام يفحص يومياً الاشتراكات المنتهية
- يتحقق من Shopify للتأكد من عدم وجود اشتراك نشط
- يرجع المستخدم للخطة المجانية تلقائياً

### 3. **عند إلغاء الاشتراك:**
- webhook يستقبل إشعار الإلغاء من Shopify
- يرجع المستخدم فوراً للخطة المجانية
- يمسح `next_billing_date`

## ✅ النتيجة النهائية:

- **✅ تجديد تلقائي:** النظام يراقب تواريخ انتهاء الاشتراكات
- **✅ إرجاع للمجاني:** عند انتهاء أو إلغاء الاشتراك
- **✅ تواريخ فوترة صحيحة:** جميع الاشتراكات لها `next_billing_date`
- **✅ مزامنة مع Shopify:** webhook يدير التحديثات فوراً
- **✅ فحص دوري:** مهمة مجدولة للتأكد من سلامة النظام

## 🔧 اختبار النظام:

```bash
# اختبار فحص الاشتراكات المنتهية
curl -X POST "https://trlklwixfeaexhydzaue.supabase.co/functions/v1/check-expired-subscriptions" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# اختبار إصلاح تواريخ الفوترة
curl -X POST "https://trlklwixfeaexhydzaue.supabase.co/functions/v1/fix-billing-dates" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```
