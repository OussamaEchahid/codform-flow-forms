
import React from 'react';
import { 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formTemplates } from '@/lib/form-utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface FormTemplatesDialogProps {
  onSelect: (templateId: number) => void;
  onClose: () => void;
}

const FormTemplatesDialog: React.FC<FormTemplatesDialogProps> = ({ 
  onSelect,
  onClose
}) => {
  const { language } = useI18n();

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader className="text-right">
        <DialogTitle>قوالب النماذج</DialogTitle>
        <DialogDescription>
          اختر أحد قوالب النماذج الجاهزة لبدء إنشاء نموذجك
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
        {formTemplates.map(template => (
          <Card 
            key={template.id} 
            className={cn(
              "overflow-hidden hover:shadow-lg transition-shadow cursor-pointer",
              "border-2 hover:border-codform-purple"
            )}
            onClick={() => onSelect(template.id)}
          >
            <div className="h-2 bg-gradient-to-r from-codform-purple to-codform-dark-purple"></div>
            <CardContent className="p-4">
              <div className="text-right mb-4">
                <h3 className="font-semibold text-lg">{template.title}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{template.fields} حقول</span>
                <span>{template.steps} خطوات</span>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 p-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full" 
                onClick={() => onSelect(template.id)}
              >
                استخدام القالب
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default FormTemplatesDialog;
