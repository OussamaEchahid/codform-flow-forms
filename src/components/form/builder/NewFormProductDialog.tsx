
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import ShopifyProductSelection from './ShopifyProductSelection';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FormField } from '@/lib/form-utils';

interface NewFormProductDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewFormProductDialog: React.FC<NewFormProductDialogProps> = ({ open, onClose }) => {
  const { language } = useI18n();
  const { shop } = useShopify();
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProducts([]);
    }
  }, [open]);
  
  // Generate default fields for new form
  const createDefaultFormFields = (): FormField[] => {
    const fields: FormField[] = [];
    
    // إضافة حقل عنوان النموذج
    fields.push({
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: language === 'ar' ? 'نموذج جديد' : 'New Form',
      helpText: language === 'ar' ? 'نموذج جديد' : 'New Form',
      style: {
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '24px',
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px',
        backgroundColor: '#9b87f5',
      }
    });
    
    // إضافة حقل الاسم الكامل
    fields.push({
      type: 'text',
      id: `text-${Date.now()}-1`,
      label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
      placeholder: language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name',
      required: true,
      icon: 'user',
    });
    
    // إضافة حقل رقم الهاتف
    fields.push({
      type: 'phone',
      id: `phone-${Date.now()}-2`,
      label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
      placeholder: language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number',
      required: true,
      icon: 'phone',
    });
    
    // إضافة حقل المدينة بعد رقم الهاتف
    fields.push({
      type: 'text',
      id: `city-${Date.now()}`,
      label: language === 'ar' ? 'المدينة' : 'City',
      placeholder: language === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name',
      required: true,
      icon: 'map-pin',
    });
    
    // إضافة حقل العنوان
    fields.push({
      type: 'textarea',
      id: `textarea-${Date.now()}`,
      label: language === 'ar' ? 'العنوان' : 'Address',
      placeholder: language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
      required: true,
    });
    
    // إضافة زر الطلب مع الإعدادات المحدثة
    fields.push({
      type: 'submit',
      id: `submit-${Date.now()}`,
      label: language === 'ar' ? 'الدفع عند الاستلام' : 'Buy with Cash on Delivery',
      style: {
        backgroundColor: '#000000',
        color: '#ffffff', 
        fontSize: '18px',
        fontWeight: '500',
        animation: true,
        animationType: 'shake',
        borderColor: '#eaeaff',
        borderRadius: '6px',
        borderWidth: '0px',
        paddingY: '12px',
        showIcon: true,
        icon: 'shopping-cart',
        iconPosition: 'left',
      },
    });
    
    return fields;
  };
  
  // Handle creating a new form with the selected products
  const handleCreateForm = async () => {
    if (selectedProducts.length === 0) {
      toast.warning(language === 'ar' 
        ? 'يرجى اختيار منتج واحد على الأقل' 
        : 'Please select at least one product');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Generate new form ID
      const newFormId = uuidv4();
      
      // Get the active shop ID
      const shopId = shop || localStorage.getItem('shopify_store') || null;
      
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        setIsCreating(false);
        return;
      }
      
      // Generate default form fields
      const defaultFields = createDefaultFormFields();
      
      // Create default form in database
      const { error: formError } = await supabase.from('forms').insert({
        id: newFormId,
        title: language === 'ar' ? 'نموذج جديد' : 'New Form',
        description: language === 'ar' ? 'نموذج جديد' : 'New Form',
        shop_id: shopId,
        is_published: false,
        data: [{
          id: '1',
          title: 'Main Step',
          fields: defaultFields
        }],
        style: {
          primaryColor: '#9b87f5',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          buttonStyle: 'rounded',
        }
      });
      
      if (formError) {
        console.error("Error creating form:", formError);
        toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
        setIsCreating(false);
        return;
      }
      
      // Create product associations - FIX: Make sure the form_id is stored as a string to match the database schema
      const productSettings = selectedProducts.map(productId => ({
        form_id: newFormId,
        product_id: productId,
        shop_id: shopId,
        enabled: true
      }));
      
      const { error: associationError } = await supabase
        .from('shopify_product_settings')
        .insert(productSettings);
      
      if (associationError) {
        console.error("Error creating product associations:", associationError);
        toast.error(language === 'ar' ? 'خطأ في ربط المنتجات' : 'Error associating products');
        // Continue anyway - we'll navigate to the form editor
      }
      
      // Navigate to the form editor
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      onClose();
      navigate(`/form-builder/${newFormId}`);
    } catch (error) {
      console.error("Error in form creation process:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'اختر المنتجات التي تريد استخدام هذا النموذج معها. لا يمكن تغيير هذه الاختيارات بعد إنشاء النموذج.'
              : 'Select which products should use this form. These associations cannot be changed after form creation.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ShopifyProductSelection 
            selectedProducts={selectedProducts}
            onChange={setSelectedProducts}
            formId="new"
            readOnly={false}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreateForm} disabled={isCreating || selectedProducts.length === 0}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...'}
              </>
            ) : (
              language === 'ar' ? 'إنشاء النموذج' : 'Create Form'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewFormProductDialog;
