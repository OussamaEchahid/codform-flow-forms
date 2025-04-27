
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

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
  const [position, setPosition] = React.useState<'product-page' | 'cart-page' | 'checkout'>('product-page');

  const handleSave = () => {
    if (!shopifyConnected || !shop) {
      toast.error(language === 'ar' 
        ? 'يجب عليك الاتصال بـ Shopify أولاً'
        : 'You need to connect to Shopify first');
      return;
    }

    onSave({
      formId,
      shopDomain: shop,
      settings: {
        position,
        style: {
          primaryColor: '#000000',
          fontSize: '16px',
          borderRadius: '4px',
        },
      },
    });
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
            <div className="bg-green-50 rounded p-3 mb-4 border border-green-200">
              <p className="text-green-700 text-sm">
                {language === 'ar' 
                  ? `أنت متصل بمتجر: ${shop}`
                  : `Connected to store: ${shop}`}
              </p>
            </div>
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

            <Button
              onClick={handleSave}
              className="w-full"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جارٍ المزامنة...' : 'Syncing...'}
                </>
              ) : (
                language === 'ar' ? 'حفظ التكامل' : 'Save Integration'
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded p-3 border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                {language === 'ar' 
                  ? 'أنت غير متصل بـ Shopify. قم بتسجيل الدخول لاستخدام هذه الميزة.'
                  : 'You are not connected to Shopify. Sign in to use this feature.'}
              </p>
            </div>
            
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => window.location.href = '/shopify'}
            >
              {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
            </Button>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm text-gray-500">
            {language === 'ar'
              ? 'سيتم مزامنة النموذج تلقائياً عند تحديث المنتجات في متجرك'
              : 'The form will automatically sync when products are updated in your store'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
