
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import ShopifyProductSelection from './ShopifyProductSelection';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Globe } from 'lucide-react';
import { FormField } from '@/lib/form-utils';

interface NewFormProductDialogProps {
  open: boolean;
  onClose: () => void;
}

type SupportedLanguage = 'ar' | 'en' | 'fr' | 'es';

const languageOptions = [
  { value: 'ar' as SupportedLanguage, label: 'العربية', flag: '🇸🇦' },
  { value: 'en' as SupportedLanguage, label: 'English', flag: '🇺🇸' },
  { value: 'fr' as SupportedLanguage, label: 'Français', flag: '🇫🇷' },
  { value: 'es' as SupportedLanguage, label: 'Español', flag: '🇪🇸' },
];

const NewFormProductDialog: React.FC<NewFormProductDialogProps> = ({ open, onClose }) => {
  const { language } = useI18n();
  const { shop } = useShopify();
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('ar');
  const [isCreating, setIsCreating] = useState(false);
  
  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedProducts([]);
      setSelectedLanguage(language as SupportedLanguage || 'ar');
    }
  }, [open, language]);
  
  // Generate default fields for new form based on selected language
  const createDefaultFormFields = (lang: SupportedLanguage): FormField[] => {
    const fields: FormField[] = [];
    
    // Language-specific text content
    const texts = {
      ar: {
        title: 'اطلب الآن',
        fullName: 'الاسم الكامل',
        fullNamePlaceholder: 'أدخل الاسم الكامل',
        phone: 'رقم الهاتف',
        phonePlaceholder: 'أدخل رقم الهاتف',
        city: 'المدينة',
        cityPlaceholder: 'أدخل المدينة',
        address: 'العنوان',
        addressPlaceholder: 'أدخل العنوان الكامل',
        submit: 'إرسال الطلب'
      },
      en: {
        title: 'Order Now',
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter full name',
        phone: 'Phone Number',
        phonePlaceholder: 'Enter phone number',
        city: 'City',
        cityPlaceholder: 'Enter city',
        address: 'Address',
        addressPlaceholder: 'Enter full address',
        submit: 'Submit Order'
      },
      fr: {
        title: 'Commander Maintenant',
        fullName: 'Nom Complet',
        fullNamePlaceholder: 'Entrez le nom complet',
        phone: 'Numéro de Téléphone',
        phonePlaceholder: 'Entrez le numéro de téléphone',
        city: 'Ville',
        cityPlaceholder: 'Entrez la ville',
        address: 'Adresse',
        addressPlaceholder: 'Entrez l\'adresse complète',
        submit: 'Envoyer la Commande'
      },
      es: {
        title: 'Ordenar Ahora',
        fullName: 'Nombre Completo',
        fullNamePlaceholder: 'Ingrese el nombre completo',
        phone: 'Número de Teléfono',
        phonePlaceholder: 'Ingrese el número de teléfono',
        city: 'Ciudad',
        cityPlaceholder: 'Ingrese la ciudad',
        address: 'Dirección',
        addressPlaceholder: 'Ingrese la dirección completa',
        submit: 'Enviar Pedido'
      }
    };

    const currentTexts = texts[lang];
    
    // إضافة حقل عنوان النموذج
    fields.push({
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: currentTexts.title,
      helpText: currentTexts.title,
      style: {
        color: '#000000',
        textAlign: (lang === 'ar' ? 'right' : 'left') as 'right' | 'left',
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
      label: currentTexts.fullName,
      placeholder: currentTexts.fullNamePlaceholder,
      required: true,
      icon: 'user',
    });
    
    // إضافة حقل رقم الهاتف
    fields.push({
      type: 'phone',
      id: `phone-${Date.now()}-2`,
      label: currentTexts.phone,
      placeholder: currentTexts.phonePlaceholder,
      required: true,
      icon: 'phone',
    });
    
    // إضافة حقل المدينة بعد رقم الهاتف
    fields.push({
      type: 'text',
      id: `city-${Date.now()}`,
      label: currentTexts.city,
      placeholder: currentTexts.cityPlaceholder,
      required: true,
      icon: 'map-pin',
    });
    
    // إضافة حقل العنوان
    fields.push({
      type: 'textarea',
      id: `textarea-${Date.now()}`,
      label: currentTexts.address,
      placeholder: currentTexts.addressPlaceholder,
      required: true,
    });
    
    // Update the submit button default styling in the dialog
    const submitButton: FormField = {
      id: `submit-button-${Date.now()}`,
      type: 'submit',
      label: currentTexts.submit,
      icon: 'shopping-cart',
      style: {
        backgroundColor: '#9b87f5', // Use our default purple color
        color: '#ffffff',
        fontSize: '19px', // Updated to 19px
        fontWeight: '500',
        animation: true,
        animationType: 'shake',
        borderColor: '#eaeaff',
        borderRadius: '6px',
        borderWidth: '0px',
        paddingY: '15px', // Updated to 15px
        showIcon: true,
        iconPosition: 'left',
      }
    };
    
    // Add the submit button to the fields array
    fields.push(submitButton);
    
    return fields;
  };
  
  // Handle creating a new form with the selected products
  const handleCreateForm = async () => {
    // منع الإنشاءات المتكررة
    if (isCreating) {
      console.log('Already creating a form, preventing duplicate creation');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Generate new form ID
      const newFormId = uuidv4();
      
      // Get the active shop ID
      const shopId = shop || localStorage.getItem('current_shopify_store') || null;
      
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        setIsCreating(false);
        return;
      }
      
      // Generate default form fields based on selected language
      const defaultFields = createDefaultFormFields(selectedLanguage);
      
      // Get current user ID or use default for Shopify stores
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;
      
      // If no traditional auth, use default user ID for Shopify stores
      if (!userId) {
        userId = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
      }
      
      // Create default form in database with language-specific title
      const formTitles = {
        ar: 'نموذج جديد',
        en: 'New Form',
        fr: 'Nouveau Formulaire',
        es: 'Nuevo Formulario'
      };
      
      const { error: formError } = await supabase.from('forms').insert({
        id: newFormId,
        title: formTitles[selectedLanguage],
        description: formTitles[selectedLanguage],
        shop_id: shopId,
        is_published: false,
        user_id: userId,
        data: [{
          id: '1',
          title: 'Main Step',
          fields: defaultFields
        }] as any,
        style: {
          primaryColor: '#9b87f5',
          borderRadius: '1.2rem', // Large border radius
          fontSize: '1rem',
          buttonStyle: 'rounded',
          borderColor: '#9b87f5', // Default border color
          borderWidth: '2px',     // Default border width
          backgroundColor: '#F9FAFB', // Default background color
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          formGap: '16px',
          formDirection: selectedLanguage === 'ar' ? 'rtl' : 'ltr',
          floatingLabels: false
        }
      });
      
      if (formError) {
        console.error("Error creating form:", formError);
        toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
        setIsCreating(false);
        return;
      }
      
      // Create product associations only if products are selected
      if (selectedProducts.length > 0) {
        const productSettings = [];
        
        // Check for existing product associations to prevent duplicate key errors
        for (const productId of selectedProducts) {
          // Check if this association already exists
          const { data: existingAssoc, error: checkError } = await supabase
            .from('shopify_product_settings')
            .select('*')
            .eq('shop_id', shopId)
            .eq('product_id', productId)
            .maybeSingle();
          
          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
            console.warn(`Error checking association for product ${productId}:`, checkError);
          }
          
          // Only add if no existing association
          if (!existingAssoc) {
            productSettings.push({
              form_id: newFormId,
              product_id: productId,
              shop_id: shopId,
              user_id: userId,
              enabled: true
            });
          }
        }
        
        // Only insert if we have new associations to create
        if (productSettings.length > 0) {
          const { error: associationError } = await supabase
            .from('shopify_product_settings')
            .insert(productSettings);
          
          if (associationError) {
            console.error("Error creating product associations:", associationError);
            toast.error(language === 'ar' ? 'خطأ في ربط المنتجات' : 'Error associating products');
            // Continue anyway - we'll navigate to the form editor
          }
        }
      }
      
      // Navigate to the form editor and refresh forms list
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      onClose();
      
      // Navigate to form editor for the new form
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
        
        <div className="py-4 space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'ar' ? 'اختر لغة النموذج' : 'Select Form Language'}
            </Label>
            <Select value={selectedLanguage} onValueChange={(value: SupportedLanguage) => setSelectedLanguage(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'ar' ? 'اختر اللغة' : 'Select language'} />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.flag}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Product Selection - Optional */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'اختر المنتجات (اختياري)' : 'Select Products (Optional)'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'يمكنك ربط هذا النموذج بمنتجات معينة أو تركه عام لجميع المنتجات'
                : 'You can associate this form with specific products or leave it general for all products'}
            </p>
            <ShopifyProductSelection 
              selectedProducts={selectedProducts}
              onChange={setSelectedProducts}
              formId="new"
              readOnly={false}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreateForm} disabled={isCreating}>
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
