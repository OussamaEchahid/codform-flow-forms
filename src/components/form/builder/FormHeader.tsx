
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Save, FileCheck, FileText, MousePointer, FileText as FormIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Switch } from '@/components/ui/switch';
import { useFormStore } from '@/hooks/useFormStore';

interface FormHeaderProps {
  onSave: () => void;
  onPublish: () => void;
  onTemplateOpen: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isPublished: boolean;
}

const FormHeader: React.FC<FormHeaderProps> = ({ 
  onSave, 
  onPublish, 
  onTemplateOpen, 
  isSaving,
  isPublishing,
  isPublished
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { formState, setFormState } = useFormStore();
  
  // Get popup button enabled state
  const isPopupEnabled = formState?.style?.popupButton?.enabled || false;
  
  // Toggle popup mode
  const togglePopupMode = () => {
    const newPopupState = !isPopupEnabled;
    
    setFormState({
      ...formState,
      style: {
        ...formState.style,
        popupButton: {
          ...formState.style?.popupButton,
          enabled: newPopupState,
          text: formState.style?.popupButton?.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now'),
          position: formState.style?.popupButton?.position || 'bottom-right',
          backgroundColor: formState.style?.popupButton?.backgroundColor || formState.style?.primaryColor || '#9b87f5',
          textColor: formState.style?.popupButton?.textColor || '#ffffff',
          borderColor: formState.style?.popupButton?.borderColor || formState.style?.primaryColor || '#9b87f5',
          borderWidth: formState.style?.popupButton?.borderWidth || '2px',
          borderRadius: formState.style?.popupButton?.borderRadius || '8px',
          fontSize: formState.style?.popupButton?.fontSize || '16px',
          fontWeight: formState.style?.popupButton?.fontWeight || '600',
          paddingY: formState.style?.popupButton?.paddingY || '12px',
          showIcon: formState.style?.popupButton?.showIcon !== undefined ? formState.style?.popupButton?.showIcon : true,
          animation: formState.style?.popupButton?.animation || 'none'
        }
      }
    });
  };

  return (
    <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/form-builder')}>
          {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </Button>
        <div className="h-4 w-[1px] bg-gray-300"></div>
        
        {/* Form as Popup Toggle */}
        <div className={`px-3 py-2 text-sm rounded-full flex items-center gap-3 transition-all cursor-pointer ${
          isPopupEnabled 
            ? 'bg-[#9b87f5] text-white shadow-md' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`} onClick={togglePopupMode}>
          {isPopupEnabled ? (
            <MousePointer size={16} className="text-white" />
          ) : (
            <FormIcon size={16} className="text-gray-600" />
          )}
          <span>{language === 'ar' ? 'نموذج كـ نافذة منبثقة' : 'Form as popup'}</span>
          <Switch 
            checked={isPopupEnabled}
            onCheckedChange={togglePopupMode}
            className="ml-1"
          />
        </div>
        
        {isPopupEnabled && (
          <div className="text-xs text-green-600 font-medium animate-pulse">
            {language === 'ar' ? '✓ نشط' : '✓ Active'}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={onTemplateOpen}
        >
          <FileText size={16} className="mr-2" />
          {language === 'ar' ? 'قوالب النماذج' : 'Form Templates'}
        </Button>
        <Button 
          className="flex items-center gap-2 bg-[#9b87f5] hover:bg-[#7E69AB]" 
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
        <Button
          variant={isPublished ? "secondary" : "default"}
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-2"
        >
          {isPublishing ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
          ) : (
            <FileCheck size={16} className="mr-2" />
          )}
          <span>{isPublished ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish') : (language === 'ar' ? 'نشر النموذج' : 'Publish')}</span>
        </Button>
      </div>
    </div>
  );
};

export default FormHeader;
