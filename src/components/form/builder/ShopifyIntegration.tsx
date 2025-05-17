
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import ShopifyProductSelection from './ShopifyProductSelection';
import { shopifySupabase } from '@/lib/shopify/supabase-client';
import { ensureUUID } from '@/lib/shopify/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void;
  isSyncing?: boolean;
  formTitleElement?: any;
  formDirection?: 'ltr' | 'rtl';
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ 
  formId, 
  onSave, 
  isSyncing,
  formDirection = 'ltr' 
}) => {
  const { language } = useI18n();
  const { shop } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isExistingForm, setIsExistingForm] = useState(false);
  const [isRTL, setIsRTL] = useState(formDirection === 'rtl');
  const params = useParams();
  
  // Load stored direction preference from localStorage
  useEffect(() => {
    try {
      const savedDirection = localStorage.getItem('codform_direction_preference');
      if (savedDirection === 'rtl') {
        setIsRTL(true);
      } else if (savedDirection === 'ltr') {
        setIsRTL(false);
      } else {
        // Default based on language if no preference stored
        setIsRTL(language === 'ar');
      }
    } catch (err) {
      console.error('Failed to load direction preference:', err);
      setIsRTL(language === 'ar');
    }
  }, [language]);
  
  // Check if this is an existing form or a new one
  useEffect(() => {
    // If formId is 'new', it's a new form being created
    // If formId is anything else, it's an existing form
    setIsExistingForm(formId !== 'new');
    
    // For existing forms, check if there are already product associations
    async function checkExistingAssociations() {
      if (formId === 'new') return;
      
      try {
        // Ensure we're using a valid UUID for the query
        const validFormId = ensureUUID(formId);
        
        const { data } = await shopifySupabase
          .from('shopify_product_settings')
          .select('product_id')
          .eq('form_id', validFormId)
          .eq('enabled', true);
        
        if (data && data.length > 0) {
          // If there are already product associations, set to read-only mode
          setIsReadOnly(true);
          setSelectedProducts(data.map(item => item.product_id));
        }
      } catch (error) {
        console.error('Error checking existing product associations:', error);
      }
    }
    
    checkExistingAssociations();
  }, [formId]);
  
  // Save product associations to the database
  const saveProductAssociations = async () => {
    if (!shop || !formId || formId === 'new' || selectedProducts.length === 0) return;
    
    try {
      // Use the ensureUUID helper to make sure we have a valid UUID
      const validFormId = ensureUUID(formId);
      
      // Call the associate_product_with_form RPC function for each product
      for (const productId of selectedProducts) {
        const { data, error } = await shopifySupabase.rpc('associate_product_with_form', {
          p_shop_id: shop,
          p_product_id: productId,
          p_form_id: validFormId,
          p_block_id: `cod-form-${formId.substring(0, 8)}`,
          p_enabled: true,
          p_is_rtl: isRTL // Save RTL setting with product association
        });
        
        if (error) {
          console.error(`Error associating product ${productId} with form:`, error);
        } else {
          console.log(`Successfully associated product ${productId} with form ${validFormId}, RTL: ${isRTL}`);
        }
      }
      
      // Update the form_direction in the shopify_form_insertion table
      try {
        const { error } = await shopifySupabase
          .from('shopify_form_insertion')
          .upsert({
            shop_id: shop,
            form_id: validFormId,
            form_direction: isRTL ? 'rtl' : 'ltr',
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'shop_id,form_id' 
          });
          
        if (error) {
          console.error('Error updating form direction:', error);
        }
      } catch (updateError) {
        console.error('Error updating form direction:', updateError);
      }
        
      // Call the onSave callback if provided
      if (onSave) {
        onSave({ 
          products: selectedProducts,
          formDirection: isRTL ? 'rtl' : 'ltr'
        });
      }
    } catch (error) {
      console.error('Error saving product associations:', error);
    }
  };
  
  // When selectedProducts changes, save associations if this is an existing form
  useEffect(() => {
    if (isExistingForm && selectedProducts.length > 0 && !isReadOnly) {
      saveProductAssociations();
    }
  }, [selectedProducts, isExistingForm, isReadOnly, isRTL]);
  
  // Handle RTL toggle
  const handleRTLToggle = (checked: boolean) => {
    setIsRTL(checked);
    
    // Save preference to localStorage
    try {
      localStorage.setItem('codform_direction_preference', checked ? 'rtl' : 'ltr');
    } catch (err) {
      console.error('Failed to save direction preference:', err);
    }
    
    // If we have an existing form and products, update the RTL setting
    if (isExistingForm && selectedProducts.length > 0) {
      saveProductAssociations();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <Badge 
          variant="outline" 
          className={`mb-2 ${isReadOnly ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
        >
          Shopify
        </Badge>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'تكامل متجر Shopify' : 'Shopify Store Integration'}
        </CardTitle>
        <CardDescription className={language === 'ar' ? 'text-right' : ''}>
          {isReadOnly 
            ? (language === 'ar' 
                ? 'يتم عرض المنتجات المرتبطة بهذا النموذج أدناه. لا يمكن تغيير هذه الارتباطات بعد إنشاء النموذج.' 
                : 'The products associated with this form are shown below. These associations cannot be changed after form creation.')
            : (language === 'ar' 
                ? 'اختر المنتجات التي تريد استخدام هذا النموذج معها' 
                : 'Choose which products should use this form')
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isReadOnly && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' 
                ? 'ملاحظة: لتغيير ارتباط المنتج، يرجى إنشاء نموذج جديد وربطه بالمنتجات المطلوبة.' 
                : 'Note: To change product associations, please create a new form and associate it with the desired products.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 flex items-center space-x-4">
          <Switch 
            id="rtl-toggle" 
            checked={isRTL} 
            onCheckedChange={handleRTLToggle} 
          />
          <Label htmlFor="rtl-toggle" className={language === 'ar' ? 'mr-2' : 'ml-2'}>
            {language === 'ar' 
              ? 'عرض النموذج من اليمين إلى اليسار (RTL)' 
              : 'Display form in Right-to-Left (RTL) mode'}
          </Label>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-1">
            <TabsTrigger value="products">
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <ShopifyProductSelection 
              selectedProducts={selectedProducts}
              onChange={setSelectedProducts}
              formId={formId}
              readOnly={isReadOnly}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
