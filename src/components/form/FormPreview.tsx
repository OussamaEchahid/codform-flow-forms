
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

interface FormPreviewProps {
  className?: string;
  formTitle?: string;
  formDescription?: string;
  children: React.ReactNode;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  className,
  formTitle = "تفاصيل التوصيل",
  formDescription,
  children
}) => {
  return (
    <Card className={cn("w-full max-w-lg mx-auto p-6 shadow-lg", className)}>
      {formTitle && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{formTitle}</h2>
          {formDescription && (
            <p className="text-gray-600 mt-1">{formDescription}</p>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-center justify-between p-3 border rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <span>0.00 dh</span>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded hover:bg-gray-100">
                <Plus size={16} />
              </button>
              <span>1</span>
              <button className="p-1 rounded hover:bg-gray-100">
                <Minus size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-sm text-gray-500">Variant info</span>
            <span className="font-medium">Product title</span>
            <ShoppingBag size={20} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {children}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span>0.00 dh</span>
          <span>المجموع الفرعي</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>0.00 dh</span>
          <span>الخصم</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>0.00 dh</span>
          <span>التوصيل</span>
        </div>
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>0.00 dh</span>
          <span>الإجمالي</span>
        </div>
      </div>

      <button className="w-full mt-6 bg-[#1a472a] hover:bg-[#143621] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2">
        <ShoppingBag size={20} />
        <span>إتمام الطلب (الدفع عند الاستلام)</span>
      </button>
    </Card>
  );
};

export default FormPreview;
