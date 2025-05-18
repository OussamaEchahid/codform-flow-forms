
/**
 * مقتطفات من التنفيذ الصحيح لحقل العنوان
 * هذا الملف يحتوي على أجزاء أساسية من الكود المستخدم لتنفيذ حقل العنوان بشكل صحيح
 * مهم: هذا ملف مرجعي فقط وليس للاستخدام المباشر
 */

// نوع BoxSizing مفقود - يجب تعريفه أو استيراده
type BoxSizing = 'border-box' | 'content-box';

/**
 * مثال لتنفيذ حقل العنوان في TitleField.tsx
 * تم تحويله إلى تعليق على شكل سلسلة نصية لتجنب أخطاء JSX في ملف TS
 */
const renderTitleExample = `
const renderTitle = (field, formStyle, language) => {
  // استخراج القيم من خصائص النمط
  const fieldStyle = field.style || {};
  const isFormTitle = field.type === 'form-title';
  const description = field.helpText || '';
  
  // استخدام قيم بكسل ثابتة بدلاً من rem
  const fontSize = isFormTitle ? '24px' : '20px'; // بدلاً من 1.5rem و 1.25rem
  const descriptionFontSize = '14px'; // بدلاً من 0.875rem
  
  // التعامل مع لون الخلفية بشكل صريح
  const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';
  
  // تطبيق الأنماط على العناصر
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px',
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px',
  };
  
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fieldStyle.fontSize || fontSize,
    fontWeight: fieldStyle.fontWeight || 'bold',
    margin: '0',
    padding: '0',
    textAlign: fieldStyle.textAlign || 'center',
  };
  
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || descriptionFontSize,
    fontWeight: 'normal', // قيمة ثابتة بدلاً من استخدام متغير
    margin: '8px 0 0 0',
    padding: '0',
    textAlign: fieldStyle.textAlign || 'center',
  };
  
  return (
    <div 
      className={\`mb-4 \${isFormTitle ? 'codform-title' : ''}\`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-testid="title-field"
      data-bg-color={backgroundColor}
    >
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
    </div>
  );
};
`;

/**
 * مثال لتنفيذ معالج تحديث الأنماط في FormTitleEditor.tsx
 */
const handleUpdateStyleExample = `
const handleUpdateStyle = (property, value, formTitleField, onUpdateTitleField) => {
  if (!formTitleField) return;
  
  // إنشاء نسخة محدثة من الحقل مع الخاصية الجديدة
  const updatedField = {
    ...formTitleField,
    style: {
      ...formTitleField.style,
      [property]: value
    }
  };
  
  // تحديث المتغيرات المحلية (في المكون الفعلي)
  // إذا كان هذا الكود في FormTitleEditor، فستحتاج إلى استدعاء:
  // if (property === 'backgroundColor') setBackgroundColor(value);
  
  // إرسال الحقل المحدث إلى المكون الأب
  onUpdateTitleField(updatedField);
};
`;

/**
 * مثال لتطبيق آلية تحديث المعاينة في FormBuilderEditor.tsx
 */
const previewRefreshExample = `
const previewRefreshExample = () => {
  // تعريف مفتاح التحديث
  const [previewRefresh, setPreviewRefresh] = useState(0);

  // زيادة قيمة المفتاح عند كل تغيير في الأنماط
  const handleStyleChange = (key, value) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
    // مهم جدًا: زيادة مفتاح التحديث
    setPreviewRefresh(prev => prev + 1);
  };

  // استخدام المفتاح في مكون المعاينة
  return (
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
  );
};
`;

/**
 * CSS المستخدم في المتجر لضمان تطبيق الأنماط بشكل صحيح
 */
const shopifyFormCSS = `
.codform-title-container {
  padding: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin-bottom: 16px !important;
}

.codform-form-title {
  margin: 0 !important;
  padding: 0 !important;
  font-family: inherit !important;
}

.codform-title-description {
  margin: 8px 0 0 0 !important;
  padding: 0 !important;
  font-weight: normal !important;
}

.codform-submit-btn {
  width: 100% !important;
  padding: 16px 20px !important;
  font-weight: bold !important;
  cursor: pointer !important;
  border: none !important;
}
`;

export { renderTitleExample, handleUpdateStyleExample, previewRefreshExample, shopifyFormCSS };
