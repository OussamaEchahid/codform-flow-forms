
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopifyProductSelection from './ShopifyProductSelection';
import { useShopify } from '@/hooks/useShopify';
import { ClipboardCheck, Loader2, Settings2 } from 'lucide-react';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShopifyIntegrationProps {
  formId: string;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ formId }) => {
  const { shop, isConnected, syncFormWithShopify, isSyncing } = useShopify();
  const { saveForm } = useFormTemplates();
  const [activeTab, setActiveTab] = useState<string>('products');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>(null);

  // Load form data
  useEffect(() => {
    const loadFormData = async () => {
      if (formId) {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
          
        if (!error && data) {
          setFormData(data);
          setIsDefault(data.is_default || false);
        }
      }
    };
    
    loadFormData();
  }, [formId]);

  // Handle default form toggle
  const handleDefaultToggle = async (checked: boolean) => {
    if (!formId || !shop) return;
    
    setIsUpdating(true);
    
    try {
      // If making this form default, unset default for all other forms first
      if (checked) {
        await supabase
          .from('forms')
          .update({ is_default: false })
          .eq('shop_id', shop);
      }
      
      // Update this form's default status
      const { error } = await supabase
        .from('forms')
        .update({ is_default: checked })
        .eq('id', formId);
        
      if (error) throw error;
      
      setIsDefault(checked);
      toast.success(checked 
        ? 'تم تعيين هذا النموذج كنموذج افتراضي للمتجر' 
        : 'تم إلغاء تعيين هذا النموذج كنموذج افتراضي');
    } catch (error) {
      console.error('Error updating default form status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة النموذج الافتراضي');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle form publishing
  const handlePublish = async () => {
    if (!formId) return;
    
    setIsUpdating(true);
    
    try {
      await saveForm(formId, { 
        is_published: true,
        isPublished: true 
      });
      
      toast.success('تم نشر النموذج بنجاح');
      
      if (formData) {
        setFormData({
          ...formData,
          is_published: true
        });
      }
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error('حدث خطأ أثناء نشر النموذج');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle form unpublishing
  const handleUnpublish = async () => {
    if (!formId) return;
    
    setIsUpdating(true);
    
    try {
      await saveForm(formId, { 
        is_published: false,
        isPublished: false 
      });
      
      toast.success('تم إلغاء نشر النموذج');
      
      if (formData) {
        setFormData({
          ...formData,
          is_published: false
        });
      }
    } catch (error) {
      console.error('Error unpublishing form:', error);
      toast.error('حدث خطأ أثناء إلغاء نشر النموذج');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Sync form with Shopify
  const handleSync = async () => {
    if (!formId || !shop) return;
    
    try {
      await syncFormWithShopify({
        formId,
        shopDomain: shop,
        settings: {
          position: 'product-page',
          insertionMethod: 'auto',
          themeType: 'auto-detect'
        }
      });
      
      toast.success('تم مزامنة النموذج مع شوبيفاي بنجاح');
    } catch (error) {
      console.error('Error syncing form with Shopify:', error);
      toast.error('حدث خطأ أثناء مزامنة النموذج مع شوبيفاي');
    }
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تكامل شوبيفاي</CardTitle>
          <CardDescription>
            لاستخدام هذا النموذج مع شوبيفاي، يجب عليك الاتصال بمتجر شوبيفاي الخاص بك أولاً.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="secondary" onClick={() => window.location.href = '/shopify'}>
            اتصل بمتجر شوبيفاي
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>تكامل شوبيفاي</CardTitle>
            <CardDescription>
              قم بتكوين كيفية عرض النموذج في متجر شوبيفاي الخاص بك.
            </CardDescription>
          </div>
          {formData && (
            <Badge variant={formData.is_published ? "success" : "secondary"}>
              {formData.is_published ? 'منشور' : 'غير منشور'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Default form setting */}
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div>
            <h4 className="font-medium">نموذج افتراضي</h4>
            <p className="text-sm text-gray-500">
              استخدم هذا النموذج للمنتجات التي ليس لها نموذج مخصص
            </p>
          </div>
          <Switch
            checked={isDefault}
            onCheckedChange={handleDefaultToggle}
            disabled={isUpdating}
          />
        </div>
        
        {/* Published state */}
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div>
            <h4 className="font-medium">حالة النشر</h4>
            <p className="text-sm text-gray-500">
              {formData?.is_published 
                ? 'هذا النموذج منشور حالياً ويمكن عرضه للعملاء'
                : 'لن يتم عرض هذا النموذج للعملاء حتى تقوم بنشره'
              }
            </p>
          </div>
          <div>
            {formData?.is_published ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUnpublish}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                إلغاء النشر
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={handlePublish}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                نشر
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1">
              <ClipboardCheck className="ml-2 h-4 w-4" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings2 className="ml-2 h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="py-4">
            <ShopifyProductSelection
              formId={formId}
              onComplete={() => {
                toast.success('تم حفظ إعدادات المنتجات بنجاح');
              }}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="py-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات متقدمة</CardTitle>
                  <CardDescription>
                    قم بتكوين إعدادات متقدمة لكيفية عرض النموذج في متجرك.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">
                      يمكنك مزامنة هذا النموذج مع متجر شوبيفاي الخاص بك يدوياً عن طريق الضغط على الزر أدناه.
                      هذا مفيد إذا قمت بإجراء تغييرات على النموذج وتريد تحديث متجرك بسرعة.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                  >
                    {isSyncing && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    مزامنة مع شوبيفاي
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
