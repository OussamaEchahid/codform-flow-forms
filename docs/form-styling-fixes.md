
# إصلاحات مشاكل تنسيق النماذج في النظام

هذا المستند يوضح المشاكل التي تم حلها في هذه النسخة من النظام والتي يجب الحفاظ عليها عند العمل في النسخ المستقبلية.

## المشاكل الرئيسية التي تم حلها

### 1. مشكلة تطبيق تغييرات خلفية عنوان النموذج

**المشكلة**: 
عدم القدرة على تغيير لون خلفية عنوان النموذج بشكل صحيح. كان المستخدم يقوم بتغيير اللون في واجهة الإعدادات لكن التغيير لم يكن يظهر في المعاينة أو في المتجر.

**الحل**:
- إضافة معالجة صريحة لخاصية `backgroundColor` في `FormTitleEditor.tsx`:
```typescript
const [backgroundColor, setBackgroundColor] = useState(formTitleField?.style?.backgroundColor || '#9b87f5');

// تحديث الحالة عند التغيير
if (property === 'backgroundColor') setBackgroundColor(value);

// تحديث حقل النموذج
const updatedField = {
  ...formTitleField,
  style: {
    ...formTitleField.style,
    backgroundColor: value
  }
};
onUpdateTitleField(updatedField);
```

- تطبيق لون الخلفية بشكل مباشر في `TitleField.tsx`:
```typescript
const backgroundStyle = {
  backgroundColor: fieldStyle.backgroundColor || '#9b87f5',
  padding: '16px',
  // ...خصائص أخرى
};

return (
  <div style={backgroundStyle} className="codform-title-container">
    // ...محتوى العنوان
  </div>
);
```

### 2. مشكلة حجم الخط وعدم ثبات العرض

**المشكلة**:
استخدام وحدات rem للخط كان يتسبب في عدم ثبات حجم الخط بين المعاينة والمتجر، حيث يمكن أن يختلف تفسير وحدة rem بين البيئات المختلفة.

**الحل**:
- استبدال وحدات rem بوحدات بكسل ثابتة في `TitleField.tsx`:
```typescript
// استخدام قيم بكسل ثابتة بدلاً من rem
const fontSize = isFormTitle ? '24px' : '20px'; // 1.5rem = 24px, 1.25rem = 20px
const descriptionFontSize = '14px'; // 0.875rem = 14px
```

- التعليق على التحويلات للتوضيح:
```typescript
// 1.5rem = 24px, 1.25rem = 20px, 0.875rem = 14px
```

### 3. مشكلة عدم تحديث المعاينة المباشر

**المشكلة**:
عند إجراء تغييرات في إعدادات النموذج، لم تكن المعاينة المباشرة تتحدث مباشرة لعرض هذه التغييرات.

**الحل**:
- استخدام آلية `refreshKey` في `FormBuilderEditor.tsx` لإجبار إعادة رسم المعاينة:
```typescript
const [previewRefresh, setPreviewRefresh] = useState(0);

// زيادة قيمة previewRefresh عند كل تغيير
const handleStyleChange = (key: string, value: string) => {
  setFormStyle({
    ...formStyle,
    [key]: value
  });
  setPreviewRefresh(prev => prev + 1);
};

// استخدام المفتاح في المكون
<FormPreview 
  key={previewRefresh}
  // ...باقي الخصائص
>
```

### 4. مشكلة خصائص وصف العنوان

**المشكلة**:
كان هناك خطأ في التعامل مع خاصية `descriptionFontWeight` التي كانت تتسبب في أخطاء أو سلوك غير متوقع.

**الحل**:
- استخدام قيمة ثابتة `normal` لوزن خط الوصف بدلاً من الاعتماد على متغير:
```typescript
const descriptionStyle = {
  // ...خصائص أخرى
  fontWeight: 'normal', // قيمة ثابتة بدلاً من استخدام descriptionFontWeight
  // ...خصائص أخرى
};
```

- إزالة جميع المراجع لـ `descriptionFontWeight` من الكود وواجهة المستخدم:
```typescript
// إزالة
// const [descWeight, setDescWeight] = useState(formTitleField?.style?.descriptionFontWeight || 'normal');

// بدلاً من ذلك
// استخدام قيمة ثابتة
<select
  id="desc-weight"
  value="normal" // استخدام قيمة ثابتة 'normal' بدلاً من descWeight
  onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
  className="...">
```

### 5. مشكلة أزرار الطلب والأزرار العائمة

**المشكلة**:
لم تكن الأزرار تطبق الأنماط والتأثيرات الحركية بشكل صحيح، خاصةً في المتجر.

**الحل**:
- إضافة خصائص `!important` في CSS للمتجر لضمان تطبيق الأنماط:
```css
.codform-submit-btn {
  width: 100% !important;
  padding: 16px 20px !important;
  font-weight: bold !important;
  // ...خصائص أخرى
}
```

- تحسين دعم التأثيرات الحركية في `codform_form.liquid`:
```css
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse-animation {
  animation: pulse 2s infinite ease-in-out !important;
}
```

## كود أساسي يجب الحفاظ عليه

### 1. معالجة خلفية العنوان في TitleField.tsx

```typescript
// الكود الأساسي لمعالجة خلفية العنوان
const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';
  
const backgroundStyle = {
  backgroundColor: backgroundColor,
  padding: '16px', // قيمة ثابتة بالبكسل للمساحة الداخلية
  borderRadius: formStyle.borderRadius || '8px',
  width: '100%',
  boxSizing: 'border-box' as BoxSizing,
  marginBottom: '16px', // هامش سفلي ثابت
};

return (
  <div 
    className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
    dir={language === 'ar' ? 'rtl' : 'ltr'}
    data-testid="title-field"
    data-bg-color={backgroundColor}
    // ...سمات البيانات الأخرى
  >
    <div style={backgroundStyle} className="codform-title-container">
      <h3 style={titleStyle}>{field.label}</h3>
      {description && <p style={descriptionStyle}>{description}</p>}
    </div>
  </div>
);
```

### 2. آلية تحديث المعاينة في FormBuilderEditor.tsx

```typescript
// آلية تحديث المعاينة
const [previewRefresh, setPreviewRefresh] = useState(0);

// استدعاء هذه الدالة بعد أي تغيير في أنماط النموذج
const handleStyleChange = (key: string, value: string) => {
  setFormStyle({
    ...formStyle,
    [key]: value
  });
  setPreviewRefresh(prev => prev + 1);
};

// استخدام المفتاح في مكون المعاينة
<FormPreviewPanel 
  key={previewRefresh} // مهم جداً لإعادة رسم المكون
  formTitle={formTitle}
  formDescription={formDescription}
  currentStep={currentPreviewStep}
  totalSteps={formSteps.length}
  formStyle={formStyle}
  fields={formSteps[currentPreviewStep - 1]?.fields || []}
  // ...خصائص أخرى
/>
```

### 3. تحديث خصائص العنوان في FormTitleEditor.tsx

```typescript
const handleUpdateStyle = (property: string, value: string) => {
  if (!formTitleField) return;
  
  const updatedField = {
    ...formTitleField,
    style: {
      ...formTitleField.style,
      [property]: value
    }
  };
  
  // تحديث المتغيرات المحلية
  if (property === 'color') setTitleColor(value);
  if (property === 'textAlign') setTitleAlignment(value);
  if (property === 'fontSize') setTitleSize(value);
  if (property === 'fontWeight') setTitleWeight(value);
  if (property === 'descriptionColor') setDescColor(value);
  if (property === 'descriptionFontSize') setDescSize(value);
  if (property === 'backgroundColor') setBackgroundColor(value);
  
  // إرسال التحديثات إلى المكون الأب
  onUpdateTitleField(updatedField);
};
```

## توصيات للتطوير المستقبلي

1. **الحفاظ على القيم الثابتة للخطوط**: استمر في استخدام قيم بكسل بدلاً من rem لضمان ثبات العرض.

2. **استمر في استخدام آلية refreshKey**: هذه الآلية ضرورية لضمان تحديث المعاينة المباشرة.

3. **تجنب استخدام descriptionFontWeight**: استخدم القيمة الثابتة 'normal' لتجنب المشاكل السابقة.

4. **اختبر دائماً على المتجر**: تأكد من اختبار جميع التغييرات على المعاينة والمتجر معاً لضمان تناسق المظهر.

5. **اهتم بالتوافق مع RTL**: افحص دائماً توافق التغييرات مع الاتجاه من اليمين إلى اليسار للغة العربية.

## الملفات الرئيسية التي يجب الانتباه لها عند الدمج

1. `src/components/form/preview/fields/TitleField.tsx` - تنفيذ عرض العنوان والتنسيق
2. `src/components/form/builder/FormTitleEditor.tsx` - واجهة تعديل خصائص العنوان
3. `src/components/form/FormPreview.tsx` - مكون المعاينة الرئيسي
4. `extensions/theme-extension-codform/blocks/codform_form.liquid` - قالب المتجر

---

تم إعداد هذا التوثيق بتاريخ: 2025-05-18
