
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
import { getFieldDefaults } from '@/lib/defaults/field-defaults';
import { getDefaultCountryCurrencySettings } from '@/lib/constants/countries-currencies';

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
  
  // Debug: Add console log for dialog state
  useEffect(() => {
    console.log('🎯 NewFormProductDialog state changed - open:', open);
  }, [open]);
  
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
        cartSummary: 'ملخص الطلب',
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
        cartSummary: 'Order Summary',
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
        cartSummary: 'Résumé de Commande',
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
        cartSummary: 'Resumen del Pedido',
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
    
    // إضافة Cart Summary قبل زر الإرسال
    if (currentTexts.cartSummary) {
      fields.push({
        type: 'cart-summary',
        id: `cart-summary-${Date.now()}`,
        label: currentTexts.cartSummary,
        cartSummaryConfig: {
          showSubtotal: true,
          showDiscount: true,
          showShipping: true,
          showTotal: true,
          subtotalLabel: lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
          discountLabel: lang === 'ar' ? 'الخصم' : 'Discount',
          shippingLabel: lang === 'ar' ? 'الشحن' : 'Shipping',
          totalLabel: lang === 'ar' ? 'المجموع الكلي' : 'Total',
          freeShippingText: lang === 'ar' ? 'شحن مجاني' : 'Free shipping',
          direction: lang === 'ar' ? 'rtl' : 'ltr',
          currency: 'SAR'
        }
      });
    }
    
    // Update the submit button default styling in the dialog
    const submitButton: FormField = {
      id: `submit-button-${Date.now()}`,
      type: 'submit',
      label: currentTexts.submit,
      icon: 'shopping-cart',
      style: {
        backgroundColor: '#9b87f5',
        ...getFieldDefaults('submit', selectedLanguage).submit.style,
        animationType: 'shake',
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
      // Resolve active shop id
      const getActiveShopId = (): string | null => {
        const keys = [
          'current_shopify_store',
          'simple_active_store',
          'shopify_store',
          'active_shop',
          'shopify_shop_domain',
          'selected_store'
        ];
        for (const key of keys) {
          const val = localStorage.getItem(key);
          if (val && val.trim() && val !== 'null' && val !== 'undefined') return val.trim();
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          const v = k ? localStorage.getItem(k) : null;
          if (v && v.includes('.myshopify.com')) return v.trim();
        }
        return null;
      };
      const shopId = shop || getActiveShopId();
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط. يرجى التأكد من اتصال المتجر أولاً.' : 'No active shop found. Please ensure your store is connected first.');
        setIsCreating(false);
        return;
      }
      
      // Generate default form fields based on selected language
      const defaultFields = createDefaultFormFields(selectedLanguage);
      
      // Get shop currency settings for default country/currency
      const getShopCurrency = async (): Promise<string | undefined> => {
        try {
          const { data: storeData, error } = await supabase
            .from('shopify_stores')
            .select('*')
            .eq('shop', shopId)
            .maybeSingle();
          
          if (error) {
            console.log('Error fetching shop data:', error);
            return undefined;
          }
          
          // Access currency from the data object
          return (storeData as any)?.currency;
        } catch (error) {
          console.log('Could not fetch shop currency, using default');
          return undefined;
        }
      };

      const shopCurrency = await getShopCurrency();
      
      // Prepare default style
      const defaultStyle = {
        primaryColor: '#9b87f5',
        borderRadius: '1.2rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
        borderColor: '#9b87f5',
        borderWidth: '2px',
        backgroundColor: '#F9FAFB',
        paddingTop: '20px',
        paddingBottom: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
        formGap: '5px',
        formDirection: selectedLanguage === 'ar' ? 'rtl' : 'ltr',
        floatingLabels: false
      };
      
      // Localized form titles
      const formTitles = {
        ar: 'نموذج جديد',
        en: 'New Form',
        fr: 'Nouveau Formulaire',
        es: 'Nuevo Formulario'
      };
      
      // Get default country/currency settings based on shop currency
      const defaultSettings = getDefaultCountryCurrencySettings(shopCurrency);
      
      // Create the form via SECURITY DEFINER RPC to satisfy RLS
      const { data: createdFormId, error: createFormError } = await (supabase as any).rpc('create_form_for_shop', {
        p_shop_id: shopId,
        p_title: formTitles[selectedLanguage],
        p_description: formTitles[selectedLanguage],
        p_data: [{ id: '1', title: 'Main Step', fields: defaultFields }] as any,
        p_style: defaultStyle as any,
        p_is_published: true
      });

      // Update form with country/currency settings after creation  
      if (createdFormId && !createFormError) {
        try {
          const { error: updateError } = await supabase
            .from('forms')
            .update({
              country: defaultSettings.country,
              currency: defaultSettings.currency,
              phone_prefix: defaultSettings.phonePrefix
            } as any)
            .eq('id', createdFormId);
            
          if (updateError) {
            console.error('Error updating form country/currency settings:', updateError);
          } else {
            console.log('✅ Updated form with country/currency settings:', defaultSettings);
          }
        } catch (error) {
          console.error('Error in form update:', error);
        }
      }
      
      if (createFormError || !createdFormId) {
        console.error('Error creating form via RPC:', createFormError);
        toast.error(language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Error creating form');
        setIsCreating(false);
        return;
      }
      
      const newFormId = createdFormId as string;

      // Create product associations only if products are selected
      if (selectedProducts.length > 0) {
        for (const productId of selectedProducts) {
          const { error: assocErr } = await supabase.rpc('associate_product_with_form', {
            p_shop_id: shopId,
            p_product_id: productId,
            p_form_id: newFormId,
            p_block_id: null,
            p_enabled: true
          });
          if (assocErr) {
            console.warn(`⚠️ Failed to associate product ${productId}:`, assocErr);
          }
        }
        console.log(`✅ Associated ${selectedProducts.length} products with form ${newFormId}`);
      }
      
      // Navigate to the form editor and refresh forms list
      toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      onClose();
      
      // Navigate to form editor for the new form - small delay to ensure database is updated
      setTimeout(() => {
        navigate(`/form-builder/${newFormId}`);
      }, 100);
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
