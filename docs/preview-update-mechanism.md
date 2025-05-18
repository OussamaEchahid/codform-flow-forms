
# آلية تحديث المعاينة المباشر للنماذج

هذا المستند يشرح بالتفصيل كيفية عمل آلية تحديث المعاينة المباشرة للنماذج، وهي أحد المكونات الأساسية التي تم إصلاحها في النظام.

## المشكلة السابقة

في الإصدارات السابقة من النظام، لم تكن التغييرات التي يقوم بها المستخدم تظهر فوراً في المعاينة المباشرة. تحديداً:

1. تغيير لون خلفية العنوان لم يكن ينعكس في المعاينة.
2. تعديل أحجام الخطوط لم يكن يظهر بشكل متسق.
3. تعديل محاذاة النص لم يكن يطبق بشكل صحيح.

## الحل المعتمد

تم تطوير آلية فعالة لضمان تحديث المعاينة المباشرة عند إجراء أي تعديلات، وتتكون من عدة أجزاء:

### 1. استخدام مفتاح تحديث (refreshKey)

تم إضافة مفتاح تحديث في المكون الرئيسي (`FormBuilderEditor.tsx`) يتغير عند كل تحديث للأنماط:

```typescript
// تعريف مفتاح التحديث
const [previewRefresh, setPreviewRefresh] = useState(0);

// زيادة قيمة المفتاح عند كل تغيير في الأنماط
const handleStyleChange = (key: string, value: string) => {
  setFormStyle({
    ...formStyle,
    [key]: value
  });
  setPreviewRefresh(prev => prev + 1);
};

// استخدام المفتاح في مكون المعاينة
<FormPreviewPanel 
  key={previewRefresh}
  formTitle={formTitle}
  formDescription={formDescription}
  currentStep={currentStep}
  totalSteps={totalSteps}
  formStyle={formStyle}
  fields={fields}
  floatingButton={floatingButton}
/>
```

عندما تتغير قيمة `refreshKey`، يقوم React بإعادة بناء المكون بالكامل، مما يضمن تطبيق جميع التغييرات.

### 2. تمرير البيانات بشكل كامل

في المعاينة، يتم تمرير البيانات من المكون الأب إلى المكونات الفرعية بشكل كامل:

```typescript
// في FormPreviewPanel.tsx
<FormPreview 
  key={refreshKey}
  formTitle={formTitle}
  formDescription={formDescription}
  currentStep={currentStep}
  totalSteps={totalSteps}
  formStyle={formStyle}
  fields={fields}
  floatingButton={floatingButton}
  hideFloatingButtonPreview={hideFloatingButtonPreview}
>
  <div></div>
</FormPreview>
```

### 3. معالجة تحديثات حقل العنوان

في `FormTitleEditor.tsx`، تم تنفيذ آلية تحديث شاملة تضمن تحديث جميع الخصائص:

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
  
  // تحديث الحالة المحلية
  if (property === 'color') setTitleColor(value);
  if (property === 'textAlign') setTitleAlignment(value);
  // ...تحديث المتغيرات الأخرى
  if (property === 'backgroundColor') setBackgroundColor(value);
  
  // إرسال التحديثات إلى المكون الأب
  onUpdateTitleField(updatedField);
};
```

### 4. تطبيق التحديثات في مكون عرض العنوان

في `TitleField.tsx`، يتم تطبيق جميع الخصائص على العناصر المرئية:

```typescript
// استخراج القيم من خصائص النمط
const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';

// تطبيق الخصائص على العناصر
<div style={backgroundStyle} className="codform-title-container">
  <h3 
    className={isFormTitle ? "codform-form-title" : ""}
    style={titleStyle}
  >
    {field.label}
  </h3>
  
  {description && (
    <p 
      className="codform-title-description"
      style={descriptionStyle}
    >
      {description}
    </p>
  )}
</div>
```

## مخطط تدفق البيانات

```
┌────────────────────┐     ┌─────────────────────┐     ┌───────────────┐
│FormBuilderEditor.tsx│     │FormPreviewPanel.tsx │     │FormPreview.tsx│
└─────────┬──────────┘     └──────────┬──────────┘     └───────┬───────┘
          │                           │                        │
          │  تحديث formStyle         │                        │
          │  زيادة refreshKey        │                        │
          ├──────────────────────────►                        │
          │                           │                        │
          │                           │  تمرير كمفتاح         │
          │                           │  key={refreshKey}      │
          │                           ├────────────────────────►
          │                           │                        │
          │                           │                        │  إعادة رسم
          │                           │                        │  المعاينة
          │                           │                        │
┌─────────▼──────────┐     ┌──────────▼──────────┐     ┌───────▼───────┐
│FormTitleEditor.tsx │     │    TitleField.tsx   │     │SubmitButton.tsx│
└─────────┬──────────┘     └──────────┬──────────┘     └───────────────┘
          │                           │
          │  تحديث                   │
          │  formTitleField.style     │
          │  backgroundColor          │
          ├──────────────────────────►
          │                           │
          │                           │  تطبيق
          │                           │  backgroundColor
          │                           │  على العنصر
          │                           │
          │                           │
```

## التوصيات للمحافظة على هذه الآلية

1. **الحفاظ على مفتاح التحديث**: عند إجراء أي تعديلات على الأنماط، تأكد من زيادة قيمة `refreshKey` لضمان إعادة رسم المعاينة.

2. **نسخ الكائنات بالكامل**: عند تحديث الأنماط، تأكد من إنشاء نسخ كاملة من الكائنات باستخدام التقنيات التالية:
   ```typescript
   // نسخ كامل للكائن
   const updatedField = {
     ...formTitleField,
     style: {
       ...formTitleField.style,
       [property]: value
     }
   };
   ```

3. **تحديث المتغيرات المحلية**: تأكد من تحديث جميع متغيرات الحالة المحلية عند تغيير الخصائص:
   ```typescript
   if (property === 'backgroundColor') setBackgroundColor(value);
   ```

4. **استخدام القيم الافتراضية**: تأكد دائماً من توفير قيم افتراضية لجميع الخصائص:
   ```typescript
   const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';
   ```

5. **استخدام وحدات البكسل الثابتة**: استخدم وحدات بكسل ثابتة بدلاً من وحدات rem لضمان عرض متسق:
   ```typescript
   const fontSize = isFormTitle ? '24px' : '20px'; // بدلاً من 1.5rem و 1.25rem
   ```

---

هذا المستند يجب أن يكون مرجعاً أساسياً عند تطوير أو تعديل آلية تحديث المعاينة في النظام.
