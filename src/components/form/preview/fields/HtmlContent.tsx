
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/security';

interface HtmlContentProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const HtmlContent: React.FC<HtmlContentProps> = ({ field, formStyle }) => {
  const { language, t } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div 
      className="mb-2"
      style={{
        color: fieldStyle.color || 'inherit',
        fontSize: fieldStyle.fontSize || formStyle.fontSize,
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {field.content ? (
        <div 
          className="html-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(field.content) }} 
        />
      ) : (
        <p className={language === 'ar' ? 'text-right' : 'text-left'}>
          {t('addHtmlContentHere')}
        </p>
      )}
    </div>
  );
};

export default HtmlContent;
