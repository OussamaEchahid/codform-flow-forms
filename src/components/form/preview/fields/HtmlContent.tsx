
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface HtmlContentProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const HtmlContent: React.FC<HtmlContentProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // إضافة معرف فريد لهذا الحقل
  const contentId = `html-content-${field.id}-${Date.now()}`;
  
  // استخدام سمات البيانات لتسهيل معالجة المحتوى في المتجر
  const dataAttributes = {
    'data-field-id': field.id,
    'data-field-type': field.type,
    'data-content-lang': language,
    'data-has-content': field.content ? 'true' : 'false',
    'data-content-dir': language === 'ar' ? 'rtl' : 'ltr',
    'data-text-color': fieldStyle.color || 'inherit',
    'data-font-size': fieldStyle.fontSize || formStyle.fontSize || '16px'
  };
  
  return (
    <div 
      className="mb-4 codform-html-content"
      style={{
        color: fieldStyle.color || 'inherit',
        fontSize: fieldStyle.fontSize || formStyle.fontSize || '16px',
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      id={contentId}
      {...dataAttributes}
    >
      {field.content ? (
        <div 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: field.content }} 
        />
      ) : (
        <p className={`${language === 'ar' ? 'text-right' : 'text-left'} placeholder-content`}>
          {language === 'ar' 
            ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.' 
            : 'Add HTML content here. You can add paragraphs, images, links and more.'}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
