
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  // استخراج خصائص النمط مع الافتراضيات المناسبة
  const {
    backgroundColor = formStyle.primaryColor || '#9b87f5',
    color = '#ffffff',
    fontSize = '24px',
    textAlign = 'center',
    fontWeight = 'bold',
    descriptionColor = '#ffffff',
    descriptionFontSize = '14px',
    showTitle = true,
    showDescription = true,
  } = field.style || {};

  // تسجيل تقديم حقل العنوان هذا
  console.log(`Rendering title field: ${field.id}`, {
    label: field.label,
    backgroundColor,
    color,
    fontSize
  });

  // إعداد أنماط مضمنة لضمان تطبيقها بشكل صحيح في المتجر
  const titleStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    color: color,
    padding: '1rem',
    borderRadius: formStyle.borderRadius || '0.5rem',
    fontSize: fontSize,
    fontWeight: fontWeight as React.CSSProperties['fontWeight'],
    textAlign: textAlign as React.CSSProperties['textAlign'],
    width: '100%',
    margin: '0 0 1rem 0',
    display: showTitle ? 'block' : 'none',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: descriptionFontSize,
    color: descriptionColor,
    marginTop: '0.5rem',
    fontWeight: 'normal',
    display: showDescription && field.helpText ? 'block' : 'none',
  };

  // أضف سمات البيانات للمساعدة في ضمان اتساق النمط
  const titleDataAttributes = {
    'data-field-type': field.type,
    'data-field-id': field.id,
    'data-background-color': backgroundColor,
    'data-text-color': color,
    'data-font-size': fontSize,
    'data-text-align': textAlign,
    'data-show-title': showTitle ? 'true' : 'false',
    'data-show-description': showDescription ? 'true' : 'false',
  };

  return (
    <div className="form-title-field" {...titleDataAttributes}>
      <div style={titleStyle} className="title-field-container">
        <h2 className="title-field-heading">{field.label}</h2>
        {field.helpText && (
          <p style={descriptionStyle} className="title-field-description">
            {field.helpText}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleField;
