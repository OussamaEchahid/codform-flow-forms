
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
  formDirection?: 'ltr' | 'rtl';
}

const HtmlContent: React.FC<HtmlContentProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  return (
    <div 
      className="mb-4"
      style={{
        color: fieldStyle.color || 'inherit',
        fontSize: fieldStyle.fontSize || formStyle.fontSize,
        direction: textDirection
      }}
    >
      {field.content ? (
        <div 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: field.content }} 
          style={{
            direction: textDirection
          }}
        />
      ) : (
        <p 
          className="text-gray-500"
          style={{ 
            textAlign: textDirection === 'rtl' ? 'right' : 'left',
            direction: textDirection
          }}
        >
          {language === 'ar' 
            ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.' 
            : 'Add HTML content here. You can add paragraphs, images, links and more.'}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
