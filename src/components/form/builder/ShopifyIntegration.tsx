
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

interface ShopifyIntegrationProps {
  formId: string;
  formTitle?: string;
  formDescription?: string;
  formStyle?: {
    primaryColor?: string;
  };
  onSave?: (settings: any) => void; // Added the onSave prop to match what's in vite-env.d.ts
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
        const { data } = await shopifySupabase
          .from('shopify_product_settings')
          .select('product_id')
          .eq('form_id', formId);
        
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
      // Delete existing associations first (to handle removals)
      await shopifySupabase
        .from('shopify_product_settings')
        .delete()
        .eq('form_id', formId);
      
      // Create new associations for each selected product
      const productSettings = selectedProducts.map(productId => ({
        form_id: formId,
        product_id: productId,
        shop_id: shop,
        enabled: true
      }));
      
      const { error } = await shopifySupabase
        .from('shopify_product_settings')
        .insert(productSettings);
      
      if (error) {
        console.error('Error saving product associations:', error);
      } else {
        console.log('Product associations saved successfully');
        // Call the onSave callback if provided
        if (onSave) {
          onSave({ products: selectedProducts });
        }
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
