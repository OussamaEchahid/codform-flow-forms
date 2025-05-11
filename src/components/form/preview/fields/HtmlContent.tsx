
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
  
  return (
    <div 
      className="mb-4"
      style={{
        color: fieldStyle.color || 'inherit',
        fontSize: fieldStyle.fontSize || formStyle.fontSize,
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {field.content ? (
        <div 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: field.content }} 
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
