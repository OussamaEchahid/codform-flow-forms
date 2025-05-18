
import React from 'react';

interface TitlePreviewProps {
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  textAlign: string;
  title: string;
  description: string;
  showDescription?: boolean;
  showTitle?: boolean;
  titleFontSize?: string;
  descriptionFontSize?: string;
  formDirection?: 'ltr' | 'rtl';
}

const TitlePreview: React.FC<TitlePreviewProps> = ({
  backgroundColor,
  textColor,
  descriptionColor,
  textAlign,
  title,
  description,
  showDescription = true,
  showTitle = true,
  titleFontSize = '1.5rem',
  descriptionFontSize = '0.875rem',
  formDirection
}) => {
  // تحديد الاتجاه بناء على القيمة المرسلة أو القيمة الافتراضية ltr
  const direction = formDirection || 'ltr';
  
  if (!showTitle) {
    return null;
  }
  
  return (
    <div
      className="w-full my-2 rounded-lg overflow-hidden"
      style={{
        backgroundColor,
        padding: '0.75rem',
        direction,
      }}
      dir={direction}
    >
      <h2
        style={{
          color: textColor,
          textAlign: textAlign as any,
          fontWeight: 'bold',
          fontSize: titleFontSize,
          margin: 0,
        }}
      >
        {title}
      </h2>
      
      {showDescription && description && (
        <p
          style={{
            color: descriptionColor,
            textAlign: textAlign as any,
            fontSize: descriptionFontSize,
            margin: '0.25rem 0 0 0',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default TitlePreview;
