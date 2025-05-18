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
  return;
};
export default TitlePreview;