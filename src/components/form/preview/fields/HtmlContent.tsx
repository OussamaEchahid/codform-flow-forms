
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
  
  // Helper function to ensure we have a string value
  const ensureStringValue = (value: any): string => {
    return typeof value === 'string' ? value : '';
  };
  
  return (
    <div 
      className="mb-4"
      style={{
        color: ensureStringValue(fieldStyle.color) || 'inherit',
        fontSize: ensureStringValue(fieldStyle.fontSize) || formStyle.fontSize,
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {field.content ? (
        <div 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: field.content as string }} 
        />
      ) : (
        <p className={language === 'ar' ? 'text-right' : 'text-left'}>
          {language === 'ar' 
            ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.' 
            : 'Add HTML content here. You can add paragraphs, images, links and more.'}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
