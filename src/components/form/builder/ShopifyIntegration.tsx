
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Loader, AlertCircle, Info, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useShopify } from '@/hooks/useShopify';

export interface ShopifyIntegrationProps {
  formId: string;
  onSave: (settings: ShopifyFormData) => void;
  isSyncing?: boolean;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({
  formId,
  onSave,
  isSyncing = false,
}) => {
  const { language } = useI18n();
  const { shopifyConnected, shop } = useAuth();
  const [position, setPosition] = useState<'product-page' | 'cart-page' | 'checkout'>('product-page');
  const { products, isLoading: loadingProducts } = useShopify();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [blockId, setBlockId] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  
  // تكوين معرف كتلة عشوائي إذا لم يكن موجودًا بالفعل
  React.useEffect(() => {
    if (!blockId) {
      const randomId = Math.random().toString(36).substring(2, 10);
      setBlockId(`codform-${randomId}`);
    }
  }, [blockId]);

  // التحقق من حالة الاتصال بالمتجر
  React.useEffect(() => {
    if (shopifyConnected && shop) {
      setConnectionStatus('success');
    } else {
      setConnectionStatus('idle');
    }
  }, [shopifyConnected, shop]);
  
  const handleSave = async () => {
    if (!shopifyConnected || !shop) {
      toast.error(language === 'ar' 
        ? 'يجب عليك الاتصال بـ Shopify أولاً'
        : 'You need to connect to Shopify first');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      setConnectionStatus('checking');
      
      // تسجيل بيانات النموذج للتصحيح
      const formData = {
        formId,
        shopDomain: shop,
        settings: {
          position,
          style: {
            primaryColor: '#000000',
            fontSize: '16px',
            borderRadius: '4px',
          },
          products: selectedProducts,
          blockId: blockId
        },
      };
      
      console.log('Saving Shopify integration with data:', formData);
      
      // استدعاء وظيفة الحفظ المقدمة من المكون الأب
      await onSave(formData);
      setConnectionStatus('success');
      
      toast.success(language === 'ar' 
        ? 'تم حفظ إعدادات شوبيفاي بنجاح'
        : 'Shopify settings saved successfully');
    } catch (error) {
      console.error('Error saving Shopify settings:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error 
        ? error.message 
        : language === 'ar' 
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'An error occurred while saving Shopify settings';
      
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const renderConnectionStatus = () => {
    if (connectionStatus === 'checking') {
      return (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <Loader className="h-4 w-4 animate-spin text-blue-500 mr-2" />
          <AlertTitle>
            {language === 'ar' ? 'جاري التحقق من الاتصال...' : 'Verifying connection...'}
          </AlertTitle>
        </Alert>
      );
    } else if (connectionStatus === 'success') {
      return (
        <Alert className="bg-green-50 border-green-200 mb-4">
          <Check className="h-4 w-4 text-green-500 mr-2" />
          <AlertTitle>
            {language === 'ar' 
              ? `متصل بمتجر: ${shop}` 
              : `Connected to store: ${shop}`}
          </AlertTitle>
        </Alert>
      );
    } else if (connectionStatus === 'error') {
      return (
        <Alert className="bg-red-50 border-red-200 mb-4">
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <AlertTitle>
            {language === 'ar' ? 'فشل الاتصال بالمتجر' : 'Connection failed'}
          </AlertTitle>
          {saveError && <AlertDescription>{saveError}</AlertDescription>}
        </Alert>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {language === 'ar' ? 'تكامل شوبيفاي' : 'Shopify Integration'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'قم بتكوين كيفية ظهور النموذج في متجر شوبيفاي الخاص بك'
            : 'Configure how your form appears in your Shopify store'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shopifyConnected ? (
          <>
            {renderConnectionStatus()}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'موقع النموذج' : 'Form Position'}
              </label>
              <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-page">
                    {language === 'ar' ? 'صفحة المنتج' : 'Product Page'}
                  </SelectItem>
                  <SelectItem value="cart-page">
                    {language === 'ar' ? 'صفحة السلة' : 'Cart Page'}
                  </SelectItem>
                  <SelectItem value="checkout">
                    {language === 'ar' ? 'صفحة الدفع' : 'Checkout'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                {language === 'ar' ? 'معرف كتلة Shopify' : 'Shopify Block ID'}
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={blockId}
                  onChange={(e) => setBlockId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={language === 'ar' ? 'معرف كتلة شوبيفاي' : 'Shopify block ID'}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newId = `codform-${Math.random().toString(36).substring(2, 10)}`;
                    setBlockId(newId);
                  }}
                >
                  {language === 'ar' ? 'توليد' : 'Generate'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar'
                  ? 'هذا المعرف مطلوب للمساعدة في تتبع النماذج المختلفة في متجرك'
                  : 'This ID is required to help track different forms in your store'}
              </p>
            </div>

            <Alert className="mt-4 bg-blue-50 border-blue-100">
              <Info className="h-4 w-4 text-blue-500 mr-2" />
              <AlertTitle className="text-sm font-medium mb-1">
                {language === 'ar' ? 'تذكير هام' : 'Important Reminder'}
              </AlertTitle>
              <AlertDescription className="text-xs text-gray-600">
                {language === 'ar'
                  ? 'بعد حفظ التكامل، يجب عليك الذهاب إلى محرر موضوعات متجرك في شوبيفاي وإضافة بلوك "نموذج الدفع عند الاستلام" في قالب المنتج. تأكد من تعيين نفس معرف النموذج الذي اخترته في إعدادات البلوك.'
                  : 'After saving the integration, you need to go to your Shopify theme editor and add the "Cash on Delivery Form" block in your product template. Make sure to set the same form ID you selected in the block settings.'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSave}
              className="w-full mt-4"
              disabled={isSaving || isSyncing}
            >
              {(isSaving || isSyncing) ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                </>
              ) : (
                language === 'ar' ? 'حفظ التكامل' : 'Save Integration'
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
              <AlertTitle>
                {language === 'ar' 
                  ? 'أنت غير متصل بـ Shopify. قم بتسجيل الدخول لاستخدام هذه الميزة.'
                  : 'You are not connected to Shopify. Sign in to use this feature.'}
              </AlertTitle>
            </Alert>
            
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => window.location.href = '/shopify'}
            >
              {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500 w-full text-center">
          {language === 'ar'
            ? 'سيتم مزامنة النموذج تلقائياً عند تحديث المنتجات في متجرك'
            : 'The form will automatically sync when products are updated in your store'}
        </p>
      </CardFooter>
    </Card>
  );
};

export default ShopifyIntegration;
