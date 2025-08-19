
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PopupButton from '@/components/form/preview/PopupButton';
import { Button } from '@/components/ui/button';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, ChevronRight, Eye, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import FormFieldComponent from '../preview/FormField';
import { useShopify } from '@/hooks/useShopify';
import { supabase } from '@/integrations/supabase/client';

interface FormPreviewPanelProps {
  formId?: string;
  formTitle: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  formStyle: any;
  fields: FormField[];
  onPreviousStep: () => void;
  onNextStep: () => void;
  refreshKey: number;
  onStyleChange: (style: any) => void;
  formCountry?: string;
  formPhonePrefix?: string;
  formCurrency?: string;
}

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({
  formId,
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  formStyle,
  fields,
  onPreviousStep,
  onNextStep,
  refreshKey,
  onStyleChange,
  formCountry = 'SA',
  formPhonePrefix = '+966',
  formCurrency
}) => {
  const { language } = useI18n();
  const { shop } = useShopify();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [associatedProductId, setAssociatedProductId] = useState<string | null>(null);
  const [productHandle, setProductHandle] = useState<string | null>(null);

  // Load associated product ID and handle for this form
  useEffect(() => {
    const loadAssociatedProduct = async () => {
      if (!formId || !shop) return;

      try {
        const { data, error } = await supabase
          .from('shopify_product_settings')
          .select('product_id')
          .eq('form_id', formId)
          .eq('shop_id', shop)
          .eq('enabled', true)
          .single();

        if (data && !error) {
          console.log('🎯 Found associated product:', data.product_id);
          setAssociatedProductId(data.product_id);

          // Fetch product details to get handle
          try {
            const { data: productData, error: productError } = await supabase.functions.invoke('shopify-products-fixed', {
              body: {
                shop: shop,
                productId: data.product_id
              }
            });

            if (productData?.success && productData?.product?.handle) {
              console.log('🎯 Found product handle:', productData.product.handle);
              setProductHandle(productData.product.handle);
            }
          } catch (productError) {
            console.error('❌ Error loading product details:', productError);
          }
        } else {
          console.log('⚠️ No associated product found for form:', formId);
        }
      } catch (error) {
        console.error('❌ Error loading associated product:', error);
      }
    };

    loadAssociatedProduct();
  }, [formId, shop]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formId || !shop) {
      toast.error(language === 'ar' ? 'معلومات النموذج غير مكتملة' : 'Form information incomplete');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Submitting form with ID:', formId, 'to shop:', shop);
      console.log('📝 Form data:', formData);
      
      // Call the submission API with correct form ID
      const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/functions/v1/api-submissions', {
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
        // Redirect to thank you page
        if (result.thankYouUrl) {
          setTimeout(() => {
            window.location.href = result.thankYouUrl;
          }, 1500);
        }
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

  // Generate product URL for storefront using handle
  const generateProductUrl = () => {
    if (!productHandle || !shop) return '';

    // Return storefront URL using product handle
    const storeUrl = shop.replace('.myshopify.com', '');
    return `https://${storeUrl}.myshopify.com/products/${productHandle}`;
  };

  // Toggle form direction between LTR and RTL
  const toggleDirection = () => {
    const newDirection = formStyle.formDirection === 'rtl' ? 'ltr' : 'rtl';
    onStyleChange({
      ...formStyle,
      formDirection: newDirection
    });
    toast.success(
      language === 'ar' 
        ? `تم تغيير الاتجاه إلى ${newDirection === 'rtl' ? 'العربية' : 'الإنجليزية'}`
        : `Direction changed to ${newDirection.toUpperCase()}`
    );
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
            {associatedProductId && productHandle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const productUrl = generateProductUrl();
                  if (productUrl) {
                    window.open(productUrl, '_blank');
                  } else {
                    toast.error(language === 'ar' ? 'لا يمكن فتح المنتج' : 'Cannot open product');
                  }
                }}
                className="flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{language === 'ar' ? 'عرض المنتج' : 'View Product'}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="max-w-md mx-auto rounded-lg shadow-sm"
            style={{
              backgroundColor: formStyle.backgroundColor || '#ffffff',
              borderRadius: formStyle.borderRadius || '8px',
              border: `${formStyle.borderWidth || '1px'} solid ${formStyle.borderColor || '#e5e7eb'}`,
              direction: formStyle.formDirection || 'ltr',
              display: 'flex',
              flexDirection: 'column',
              gap: formStyle.formGap || '5px',
              paddingTop: formStyle.paddingTop || '20px',
              paddingBottom: formStyle.paddingBottom || '20px',
              paddingLeft: formStyle.paddingLeft || '20px',
              paddingRight: formStyle.paddingRight || '20px'
            }}
          >
            {fields.map((field, index) => (
              <div key={`${field.id}-${refreshKey}`}>
                 <FormFieldComponent
                   field={field}
                   formStyle={formStyle}
                   formCountry={formCountry}
                   formPhonePrefix={formPhonePrefix}
                   formCurrency={formCurrency}
                   value={formData[field.id]}
                   onChange={(value) => handleInputChange(field.id, value)}
                   productId={associatedProductId || field.productId}
                   {...(field.type === 'submit' && { 
                     onClick: () => handleSubmit({ preventDefault: () => {} } as React.FormEvent),
                     disabled: isSubmitting 
                   })}
                 />
              </div>
            ))}
          </div>
        </form>
      </CardContent>
      
      {/* Popup Button Preview */}
      {formStyle.popupButton?.enabled && (
        <PopupButton 
          config={formStyle.popupButton}
          onScroll={() => {
            const formElement = document.querySelector('.max-w-md');
            if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}
    </Card>
  );
};

export default FormPreviewPanel;
