
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormPreviewProps {
  className?: string;
  formTitle?: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  className,
  formTitle = "نموذج طلب منتج",
  formDescription = "يرجى تعبئة النموذج التالي لطلب المنتج والدفع عند الاستلام",
  currentStep,
  totalSteps,
  children
}) => {
  return (
    <Card className={cn("w-full max-w-lg mx-auto shadow-lg", className)}>
      <div className="h-2 bg-gray-100 rounded-t-lg">
        <div 
          className="h-full bg-gradient-to-r from-codform-purple to-codform-dark-purple rounded-tl-lg" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      <div className="p-6">
        <div className="text-right mb-6">
          <h2 className="text-xl font-bold mb-2">{formTitle}</h2>
          <p className="text-gray-600">{formDescription}</p>
          <div className="mt-2 text-sm text-gray-500">
            الخطوة {currentStep} من {totalSteps}
          </div>
        </div>
        <CardContent className="p-0">
          {children}
        </CardContent>
      </div>
    </Card>
  );
};

export default FormPreview;
