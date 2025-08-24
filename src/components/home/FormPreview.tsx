import React from 'react';
import { useI18n } from '@/lib/i18n';

interface FormTemplate {
  id: number;
  type: string;
  imageSrc: string;
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  theme: string;
  features: {
    ar: string[];
    en: string[];
  };
}

interface FormPreviewProps {
  template: FormTemplate;
}

const FormPreview: React.FC<FormPreviewProps> = ({ template }) => {
  const { language } = useI18n();

  return (
    <div className="flex-shrink-0 w-full flex justify-center">
      <div className="relative max-w-sm mx-auto">
        <img
          src={template.imageSrc}
          alt={template.title[language]}
          className="w-full h-auto object-contain"
        />
        {/* طبقة تفاعلية شفافة */}
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-5 transition-all duration-300 cursor-pointer" />
      </div>
    </div>
  );
};

export default FormPreview;