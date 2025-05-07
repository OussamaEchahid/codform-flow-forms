
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
  
  const contentStyle = {
    color: fieldStyle.color || 'inherit',
    fontSize: fieldStyle.fontSize || formStyle.fontSize || '1rem',
    textAlign: isRtl ? 'right' : 'left',
    direction: isRtl ? 'rtl' : 'ltr',
    lineHeight: '1.5',
    fontFamily: 'inherit',
  } as React.CSSProperties;
  
  return (
    <div 
      className="mb-4 w-full"
      style={contentStyle}
    >
      {field.content ? (
        <div 
          className="prose max-w-none w-full" 
          style={{ 
            direction: isRtl ? 'rtl' : 'ltr',
            textAlign: isRtl ? 'right' : 'left',
          }}
          dangerouslySetInnerHTML={{ __html: field.content }}
        />
      ) : (
        <p style={{ margin: '0.5rem 0' }}>
          {isRtl 
            ? 'أضف محتوى HTML هنا. يمكنك إضافة فقرات، صور، روابط وغيرها.' 
            : 'Add HTML content here. You can add paragraphs, images, links and more.'}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
