
# دليل تكامل النماذج مع Shopify

هذا الدليل يوثق الطريقة الصحيحة لدمج وعرض نماذج الدفع عند الاستلام (COD Forms) في متجر Shopify. تم استخلاصه من النسخة المستقرة التي تعمل بشكل صحيح.

## 1. نظرة عامة على آلية العمل

النظام يعمل بالطريقة التالية:
1. يتم إنشاء امتداد سمة (Theme Extension) في Shopify يتضمن كتلة (Block) يمكن إضافتها إلى صفحة المنتج
2. يتم إدراج هذه الكتلة في قالب صفحة المنتج (إما تلقائيًا أو يدويًا)
3. الكتلة تحتوي على عنصر HTML فارغ مع معرّف فريد ومعرّف النموذج
4. ملف JavaScript خارجي (codform.js) يتم تحميله مع الامتداد ويقوم بتحميل النموذج داخل هذا العنصر

## 2. ملفات الأساسية وطريقة عملها

### 2.1 ملف Liquid للكتلة (codform_form.liquid)

```liquid
{% if product %}
<div id="codform-container-{{ block.id }}" class="codform-container" data-product-id="{{ product.id }}" data-form-id="{{ block.settings.form_id }}" data-hide-header="true">
  <div class="codform-form-container">
    <div id="codform-form-loader-{{ block.id }}" class="codform-loader">
      <div class="codform-spinner"></div>
      <p>جاري تحميل النموذج...</p>
    </div>

    <div id="codform-form-{{ block.id }}" class="codform-form" style="display: none;">
      <!-- النموذج سيتم تحميله ديناميكيًا هنا -->
    </div>

    <div id="codform-success-{{ block.id }}" class="codform-success" style="display: none;">
      <div class="codform-success-icon">✓</div>
      <h4>تم إرسال الطلب بنجاح</h4>
      <p>شكرًا لك، سنتواصل معك في أقرب وقت لإتمام عملية الدفع عند الاستلام.</p>
    </div>

    <div id="codform-error-{{ block.id }}" class="codform-error" style="display: none;">
      <div class="codform-error-icon">!</div>
      <h4>حدث خطأ</h4>
      <p>حدث خطأ أثناء تحميل النموذج، يرجى المحاولة مرة أخرى.</p>
      <button id="codform-retry-{{ block.id }}" class="codform-button">إعادة المحاولة</button>
    </div>
  </div>
</div>
```

### 2.2 ملف JavaScript (codform.js)

هذا الملف مسؤول عن:
1. تحديد عناصر النموذج في الصفحة
2. جلب محتوى النموذج من الخادم
3. عرض النموذج وإخفاء شاشة التحميل
4. معالجة إرسال النموذج

النقاط المهمة في آلية العمل:
- يتم العثور على جميع حاويات النماذج باستخدام `document.querySelectorAll('.codform-container')`
- لكل حاوية، يتم جلب معرف النموذج باستخدام `container.getAttribute('data-form-id')`
- يتم إنشاء iframe لعرض النموذج المضمن أو جلب محتوى النموذج مباشرة

### 2.3 تكوين امتداد السمة (shopify.extension.toml)

```toml
name = "CODFORM - نماذج الدفع عند الاستلام"
type = "theme"
handle = "theme-extension-codform"

[[metafields]]
namespace = "codform"
key = "settings"

[[extensions.blocks]]
name = "نموذج الدفع عند الاستلام"
handle = "codform_form"
type = "product"
target = "section"
```

## 3. الخطوات الصحيحة لتكامل النموذج

### 3.1 إعداد الامتداد

1. التأكد من أن ملفات الامتداد موجودة في المكان الصحيح:
   - `extensions/theme-extension-codform/blocks/codform_form.liquid`
   - `extensions/theme-extension-codform/assets/codform.js`
   - `extensions/theme-extension-codform/shopify.extension.toml`

2. التأكد من أن ملف JavaScript يشير إلى الخادم الصحيح:
   ```js
   const FORM_API_URL = "https://codform-flow-forms.lovable.app";
   ```

### 3.2 آلية عرض النموذج

النموذج يُعرض بالطريقة التالية:
1. من خلال تضمين iframe:
   ```html
   <iframe src="${FORM_API_URL}/embed/${formId}" frameborder="0" style="width:100%; height:700px;"></iframe>
   ```

2. أو عن طريق جلب المحتوى وعرضه مباشرة (HTML):
   ```js
   fetch(`${FORM_API_URL}/api/forms/${formId}`)
     .then(response => response.json())
     .then(data => {
       // عرض النموذج مباشرة
     });
   ```

### 3.3 معالجة الأخطاء

النظام يتعامل مع الأخطاء بالطريقة التالية:
1. إظهار رسالة خطأ عندما يفشل تحميل النموذج
2. توفير زر "إعادة المحاولة" للمستخدم
3. تسجيل معلومات الخطأ في وحدة التحكم (console)

## 4. قائمة التحقق للتكامل الصحيح

✅ إعدادات الامتداد صحيحة في shopify.extension.toml  
✅ عناصر HTML لها معرفات فريدة لا تتعارض مع العناصر الأخرى في الصفحة  
✅ استخدام معرف النموذج الصحيح من إعدادات الكتلة  
✅ التعامل المناسب مع الأخطاء  
✅ استخدام أسلوب CSS متوافق لا يتعارض مع قالب المتجر  

## 5. حل المشكلات الشائعة

### 5.1 النموذج لا يظهر

الأسباب المحتملة:
- معرف النموذج غير صحيح
- مسار API غير صحيح
- خطأ في تحميل ملف JavaScript
- تعارض مع JavaScript آخر في الصفحة

الحلول:
- تحقق من معرف النموذج في إعدادات الكتلة
- تأكد من تحميل ملف codform.js بشكل صحيح
- افحص وحدة التحكم (console) للأخطاء

### 5.2 أخطاء CORS

إذا ظهرت أخطاء CORS، تأكد من:
1. تكوين الخادم للسماح بطلبات من نطاق متجر Shopify
2. استخدام iframe بدلاً من الجلب المباشر لتجنب قيود CORS

### 5.3 مشاكل التنسيق

إذا كان النموذج يظهر ولكن التنسيق غير صحيح:
1. تأكد من أن CSS لا يتعارض مع قالب المتجر
2. تحقق من تحميل الخطوط المطلوبة
3. اضبط العرض والارتفاع للإطار (iframe) أو الحاوية

## 6. ملاحظات هامة

1. **الإصدارات المختلفة من قوالب Shopify**: تختلف طريقة إدراج الكتلة حسب نوع القالب:
   - القوالب القياسية: يتم إدراجها في product.liquid
   - قوالب Online Store 2.0: يتم إدراجها في product.json

2. **توافق المستعرضات**: تم اختبار الحل مع:
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **تحميل النموذج**: يتم التحميل بعد تحميل الصفحة بالكامل لتجنب التأثير على أداء الصفحة.

## 7. مسارات API المهمة

1. **تحميل النموذج**: `${FORM_API_URL}/api/forms/${formId}`
2. **عرض النموذج المضمن**: `${FORM_API_URL}/embed/${formId}`
3. **إرسال النموذج**: `${FORM_API_URL}/api/submissions`

## 8. التحسينات المستقبلية

1. تحسين أداء التحميل عن طريق استخدام استراتيجيات التحميل البطيء (lazy loading)
2. تحسين تجربة المستخدم من خلال تنعيم الانتقالات
3. دعم أفضل للأجهزة المحمولة
4. زيادة خيارات التخصيص من خلال إعدادات الكتلة
