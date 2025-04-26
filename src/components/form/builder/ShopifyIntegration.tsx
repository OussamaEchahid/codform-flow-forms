
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

interface ShopifyIntegrationProps {
  formId: string;
  onSave: (settings: ShopifyFormData) => void;
  isConnected: boolean;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({
  formId,
  onSave,
  isConnected,
}) => {
  const { language } = useI18n();
  const [position, setPosition] = React.useState<'product-page' | 'cart-page' | 'checkout'>('product-page');

  const handleSave = () => {
    onSave({
      formId,
      shopDomain: '', // This will be set when connected to Shopify
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
          disabled={!isConnected}
        >
          {language === 'ar' ? 'حفظ التكامل' : 'Save Integration'}
        </Button>

        {!isConnected && (
          <p className="text-sm text-red-500">
            {language === 'ar' 
              ? 'يجب عليك الاتصال بـ Shopify أولاً'
              : 'You need to connect to Shopify first'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopifyIntegration;
