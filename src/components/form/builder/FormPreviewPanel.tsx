
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Eye, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import FormFieldComponent from '../preview/FormField';
import { useShopify } from '@/hooks/useShopify';
import { useFormStore } from '@/hooks/useFormStore';

interface FormPreviewPanelProps {}

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = () => {
  const { title: formTitle, description: formDescription, steps, style: formStyle, country, phonePrefix } = useFormStore();
  const currentStep = 1;
  const totalSteps = steps.length || 1;
  const fields = steps.length > 0 ? steps[0].fields : [];
  const formId = '';
  const refreshKey = 0;
  const { language } = useI18n();
  const { shop } = useShopify();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shop) {
      toast.error(language === 'ar' ? 'معلومات النموذج غير مكتملة' : 'Form information incomplete');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting form with ID:', formId, 'to shop:', shop);
      console.log('📝 Form data:', formData);
      
      // Call the submission API with correct form ID
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: formId,
          shopDomain: shop,
          data: formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(language === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Order submitted successfully');
        setFormData({});
      } else {
        toast.error(result.error || (language === 'ar' ? 'فشل في إرسال الطلب' : 'Failed to submit order'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(language === 'ar' ? 'خطأ في إرسال الطلب' : 'Error submitting order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Generate form URL for sharing
  const generateFormUrl = () => {
    if (!formId || !shop) return '';
    return `${window.location.origin}/form/${formId}?shop=${shop}`;
  };

  // Copy form URL to clipboard
  const copyFormUrl = () => {
    const url = generateFormUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success(language === 'ar' ? 'تم نسخ الرابط' : 'URL copied to clipboard');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyFormUrl}
              className="flex items-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'نسخ الرابط' : 'Copy URL'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(generateFormUrl(), '_blank')}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{language === 'ar' ? 'فتح' : 'Open'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="max-w-md mx-auto p-6 rounded-lg shadow-sm"
            style={{
              backgroundColor: formStyle.backgroundColor || '#ffffff',
              borderRadius: formStyle.borderRadius || '8px',
              border: `${formStyle.borderWidth || '1px'} solid ${formStyle.borderColor || '#e5e7eb'}`,
              direction: formStyle.formDirection || 'ltr',
              gap: formStyle.formGap || '16px'
            }}
          >
            {fields.map((field, index) => (
              <div key={`${field.id}-${refreshKey}`} className="mb-4">
                <FormFieldComponent
                  field={field}
                  formStyle={formStyle}
                  formCountry={country || 'SA'}
                  formPhonePrefix={phonePrefix || '+966'}
                  value={formData[field.id]}
                  onChange={(value) => handleInputChange(field.id, value)}
                />
              </div>
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FormPreviewPanel;
