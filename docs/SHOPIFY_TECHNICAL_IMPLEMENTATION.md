
# التنفيذ التقني لتكامل نماذج COD مع Shopify

هذا المستند يوفر تفاصيل تقنية عن كيفية عمل تكامل نماذج الدفع عند الاستلام (COD) مع متاجر Shopify.

## 1. الهيكل التقني الأساسي

### 1.1 مكونات النظام

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Theme Extension│      │   Form Backend  │      │   Database      │
│  (Shopify Store)│◄────►│   (API Server)  │◄────►│   (Supabase)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **امتداد السمة (Theme Extension)**: يتم تثبيته في متجر Shopify ويعرض النموذج
2. **خادم النموذج (Form Backend)**: API يستضيف النماذج ويعالج عمليات الإرسال
3. **قاعدة البيانات (Database)**: تخزن تعريفات النماذج والمرسلات

### 1.2 تدفق البيانات

1. المستخدم يدخل صفحة منتج في متجر Shopify
2. امتداد السمة يقرأ معرّف النموذج من إعدادات الكتلة
3. JavaScript يقوم بطلب بيانات النموذج من خادم النموذج
4. النموذج يُعرض للمستخدم
5. عند التقديم، يتم إرسال البيانات إلى خادم النموذج
6. خادم النموذج يخزن البيانات في قاعدة البيانات

## 2. تحليل الشيفرة المصدرية

### 2.1 امتداد السمة في Shopify

#### شيفرة Liquid الأساسية (مبسطة):

```liquid
<div data-form-id="{{ block.settings.form_id }}">
  <div class="loading-view">جاري التحميل...</div>
  <div class="form-view" style="display:none"></div>
  <div class="success-view" style="display:none">نجاح!</div>
  <div class="error-view" style="display:none">خطأ!</div>
</div>
```

#### الشيفرة الأساسية لـ JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const containers = document.querySelectorAll('[data-form-id]');
  
  containers.forEach(container => {
    const formId = container.getAttribute('data-form-id');
    if (!formId) return;
    
    const formView = container.querySelector('.form-view');
    const loadingView = container.querySelector('.loading-view');
    
    // جلب النموذج
    fetch(`https://codform-flow-forms.lovable.app/api/forms/${formId}`)
      .then(response => response.json())
      .then(data => {
        // عرض النموذج
        loadingView.style.display = 'none';
        formView.style.display = 'block';
        renderForm(formView, data);
      })
      .catch(error => {
        // عرض الخطأ
        loadingView.style.display = 'none';
        container.querySelector('.error-view').style.display = 'block';
        console.error('Form loading error:', error);
      });
  });
});
```

### 2.2 واجهة برمجة التطبيقات (API)

الطلبات الرئيسية المستخدمة:

1. **جلب النموذج**:
   ```
   GET /api/forms/{formId}
   ```
   
2. **إرسال النموذج**:
   ```
   POST /api/submissions
   {
     "formId": "uuid-here",
     "data": { ... form data ... }
   }
   ```

## 3. تحليل المكون الرئيسي - ShopifyIntegration.tsx

المكون `ShopifyIntegration.tsx` هو المسؤول عن توفير واجهة لربط النماذج بمتجر Shopify. الوظائف الأساسية:

1. **عرض معلومات النموذج**: معرف النموذج، العنوان، الوصف، إلخ.
2. **توفير تعليمات الدمج**: كيفية إدراج النموذج في المتجر
3. **نسخ معرف النموذج**: لتسهيل عملية الدمج

ملاحظات مهمة من تحليل الشيفرة:
- **إخفاء ترويسة النموذج تلقائيًا**: `data-hide-header="true"`
- **تخصيص الألوان والتنسيق**: يتم تمريرها من خلال نمط CSS مضمن
- **تعامل مفصل مع الأخطاء**: رسائل خطأ ووظيفة إعادة المحاولة

## 4. اختلافات التنفيذ حسب نوع قالب Shopify

### 4.1 القوالب التقليدية (Legacy)

- يتم إدراج صفحة المنتج عن طريق تحديث ملف `product.liquid`
- يُستخدم `{% include 'codform' %}` لتضمين النموذج
- أكثر تعرضًا للكسر بسبب التعديل اليدوي

### 4.2 قوالب Online Store 2.0

- يتم إدراج الكتلة عن طريق تحديث ملف `product.json`
- أكثر موثوقية وأقل عرضة للكسر
- يستخدم نظام الكتل القياسي في Shopify

```json
{
  "sections": {
    "main": {
      "blocks": {
        "codform_123": {
          "type": "theme-extension-codform.codform_form",
          "settings": {
            "form_id": "uuid-here"
          }
        }
      }
    }
  }
}
```

## 5. التنفيذ الوظيفي لـ codform.js

التنفيذ الوظيفي لملف `codform.js` يتضمن:

1. **تهيئة النماذج**:
   ```javascript
   function initForms() {
     const containers = document.querySelectorAll('.codform-container');
     containers.forEach(initSingleForm);
   }
   ```

2. **تهيئة نموذج واحد**:
   ```javascript
   function initSingleForm(container) {
     const formId = container.getAttribute('data-form-id');
     const blockId = container.id.split('-').pop();
     
     // إعداد مراجع DOM
     const formContainer = container.querySelector(`#codform-form-${blockId}`);
     const loadingEl = container.querySelector(`#codform-form-loader-${blockId}`);
     const successEl = container.querySelector(`#codform-success-${blockId}`);
     const errorEl = container.querySelector(`#codform-error-${blockId}`);
     
     // جلب النموذج
     fetchForm(formId, formContainer, loadingEl, errorEl);
     
     // إعداد زر إعادة المحاولة
     const retryButton = container.querySelector(`#codform-retry-${blockId}`);
     if (retryButton) {
       retryButton.addEventListener('click', () => {
         errorEl.style.display = 'none';
         loadingEl.style.display = 'flex';
         fetchForm(formId, formContainer, loadingEl, errorEl);
       });
     }
   }
   ```

3. **جلب النموذج**:
   ```javascript
   function fetchForm(formId, formContainer, loadingEl, errorEl) {
     fetch(`${FORM_API_URL}/api/forms/${formId}`)
       .then(response => {
         if (!response.ok) {
           throw new Error(`Form fetch failed: ${response.status}`);
         }
         return response.json();
       })
       .then(data => {
         renderForm(formContainer, data);
         loadingEl.style.display = 'none';
         formContainer.style.display = 'block';
       })
       .catch(error => {
         console.error('Error loading form:', error);
         loadingEl.style.display = 'none';
         errorEl.style.display = 'block';
       });
   }
   ```

## 6. استراتيجيات العمل في وضع عدم الاتصال

النظام يدعم العمل في وضع عدم الاتصال من خلال:

1. **تخزين النماذج محليًا**: حفظ النماذج المستخدمة مؤخرًا في localStorage
2. **تخزين الإرسالات غير المكتملة**: حفظ الإرسالات لإعادة محاولة إرسالها لاحقًا
3. **إشعار المستخدم**: إبلاغ المستخدم عندما يكون في وضع عدم الاتصال

## 7. نصائح للتنفيذ الناجح

1. **استخدم محرر الملفات**: وليس محرر السمات المضمن في Shopify عند التعامل مع ملفات JavaScript
2. **احرص على استخدام معرفات فريدة**: تجنب تعارضات المعرفات
3. **تعامل مع السياق العالمي بحذر**: تجنب تلويث النطاق العالمي window
4. **راقب حجم الشيفرة**: حافظ على حجم البرنامج النصي صغيرًا لتحسين الأداء
5. **سجل الأخطاء لتسهيل التصحيح**: استخدم `console.error` للأخطاء المهمة

## 8. نموذج حل المشكلات

```
┌───────────────────────┐
│ النموذج لا يظهر      │
└───────────┬───────────┘
            ▼
┌───────────────────────┐         ┌───────────────────────┐
│ هل يظهر خطأ في وحدة  │─── نعم ──►  تحقق من سجل الأخطاء │
│ التحكم (Console)?    │         └───────────┬───────────┘
└───────────┬───────────┘                     │
            │ لا                              ▼
            ▼                      ┌───────────────────────┐
┌───────────────────────┐         │ أصلح المشكلة حسب      │
│ هل تم تحميل ملف      │─── لا ──►│ رسالة الخطأ           │
│ codform.js?          │         └───────────────────────┘
└───────────┬───────────┘
            │ نعم
            ▼
┌───────────────────────┐         ┌───────────────────────┐
│ هل معرف النموذج صحيح؟ │─── لا ──►│ تصحيح معرف النموذج   │
└───────────┬───────────┘         └───────────────────────┘
            │ نعم
            ▼
┌───────────────────────┐         ┌───────────────────────┐
│ هل يتم تنفيذ استدعاء  │─── لا ──►│ التحقق من تحميل DOM  │
│ fetchForm?            │         └───────────────────────┘
└───────────┬───────────┘
            │ نعم
            ▼
┌───────────────────────┐
│ تحقق من إعدادات CORS  │
│ والطلبات الشبكية     │
└───────────────────────┘
```

## 9. ممارسات أمان وأداء مهمة

1. **إرسال النموذج**: استخدم أسلوب POST بدلاً من GET
2. **التحقق من CORS**: تأكد من إعدادات CORS لتجنب أخطاء الوصول عبر المنشأ
3. **تحميل متأخر**: تحميل النموذج فقط عندما يصبح مرئيًا
4. **التحقق من البيانات**: تحقق من البيانات على جانب الخادم قبل الحفظ
5. **تجنب XSS**: استخدم ترميز HTML المناسب لمنع هجمات XSS

## 10. اختبار التوافق

الصيغة المستخدمة حاليًا متوافقة مع:

| المتصفح | النسخة الدنيا المدعومة |
|---------|------------------------|
| Chrome  | 65+                    |
| Firefox | 60+                    |
| Safari  | 12+                    |
| Edge    | 79+                    |
| IE      | غير مدعوم              |
