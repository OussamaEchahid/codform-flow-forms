
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
import { supabase } from '@/integrations/supabase/client';
import { ensureUUID } from '@/lib/shopify/types';

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
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId, onSave, isSyncing }) => {
  const { language } = useI18n();
  const { shop } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isExistingForm, setIsExistingForm] = useState(false);
  const params = useParams();
  
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
        
        const { data } = await supabase
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
        const { data, error } = await supabase.rpc('associate_product_with_form', {
          p_shop_id: shop,
          p_product_id: productId,
          p_form_id: validFormId,
          p_block_id: `cod-form-${formId.substring(0, 8)}`,
          p_enabled: true
        });
        
        if (error) {
          console.error(`Error associating product ${productId} with form:`, error);
        } else {
          console.log(`Successfully associated product ${productId} with form ${validFormId}`);
        }
      }
        
      // Call the onSave callback if provided
      if (onSave) {
        onSave({ products: selectedProducts });
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
  }, [selectedProducts, isExistingForm, isReadOnly]);
  
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
                ? 'اختر المنتجات التي تريد استخدام هذا النموذج معها وأضف عنواناً مميزاً للنموذج' 
                : 'Choose which products should use this form and add a descriptive title')
          }
        </CardDescription>
        
        {/* Form Title Editor for new forms */}
        {!isReadOnly && formId === 'new' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
            </h3>
            <input
              type="text"
              placeholder={language === 'ar' ? 'أدخل عنواناً مميزاً للنموذج' : 'Enter a descriptive form title'}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onChange={(e) => {
                // Store the title in localStorage or pass to parent
                localStorage.setItem('new_form_title', e.target.value);
              }}
            />
            <p className="text-xs text-blue-600 mt-1">
              {language === 'ar' 
                ? 'هذا العنوان سيساعدك على التمييز بين نماذجك المختلفة' 
                : 'This title will help you distinguish between your different forms'}
            </p>
          </div>
        )}
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
