
import React from 'react';

interface TitlePreviewProps {
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  textAlign: string;
  title: string;
  description: string;
  showDescription?: boolean;
}

const TitlePreview: React.FC<TitlePreviewProps> = ({
  backgroundColor,
  textColor,
  descriptionColor,
  textAlign,
  title,
  description,
  showDescription = true
}) => {
  return (
    <div style={{ 
      backgroundColor, 
      padding: '0.75rem',
      borderRadius: '0.5rem',
    }}>
      <h2 style={{ 
        color: textColor,
        margin: 0,
        textAlign: textAlign as any,
      }}>
        {title}
      </h2>
      {showDescription && description && (
        <p style={{ 
          color: descriptionColor,
          margin: '0.25rem 0 0 0',
          fontSize: '0.875rem',
          textAlign: textAlign as any,
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default TitlePreview;
