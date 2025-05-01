
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X } from 'lucide-react';

interface FormHeaderProps {
  formTitle: string;
  formDescription?: string;
  onUpdateForm: (title: string, description: string) => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({
  formTitle,
  formDescription = '',
  onUpdateForm
}) => {
  const { language } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(formTitle);
  const [description, setDescription] = useState(formDescription || '');

  const handleSave = () => {
    if (!title.trim()) {
      return; // Don't save empty title
    }
    
    onUpdateForm(title, description);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(formTitle);
    setDescription(formDescription || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white border-b p-4">
        <div className="container mx-auto">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="text-xl font-medium flex-1"
                placeholder={language === 'ar' ? "عنوان النموذج" : "Form title"}
              />
            </div>
            <div>
              <Textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-gray-600"
                placeholder={language === 'ar' ? "وصف النموذج (اختياري)" : "Form description (optional)"}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X size={16} className="mr-1" />
                {language === 'ar' ? "إلغاء" : "Cancel"}
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save size={16} className="mr-1" />
                {language === 'ar' ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b p-4">
      <div className="container mx-auto">
        <div className="flex justify-between">
          <div>
            <h1 className="text-xl font-medium">{title || (language === 'ar' ? "نموذج بلا عنوان" : "Untitled Form")}</h1>
            {description && <p className="text-gray-600">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit size={16} className="mr-1" />
            {language === 'ar' ? "تعديل" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
