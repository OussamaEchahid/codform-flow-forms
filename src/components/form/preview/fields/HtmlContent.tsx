
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
  const isRtl = language === 'ar';
  
  return (
    <div 
      className="mb-4"
      style={{
        color: fieldStyle.color || 'inherit',
        fontSize: fieldStyle.fontSize || formStyle.fontSize,
        textAlign: isRtl ? 'right' : 'left',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {field.content ? (
        <div 
          className="prose max-w-none" 
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          dangerouslySetInnerHTML={{ __html: field.content }}
        />
      ) : (
        <p>
          {isRtl 
            ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.' 
            : 'Add HTML content here. You can add paragraphs, images, links and more.'}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
