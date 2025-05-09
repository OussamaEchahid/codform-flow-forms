
import React from 'react';
import { useShopifySettings } from '@/lib/shopify/ShopifySettingsProvider';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, LifeBuoy, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const ShopifySettings = () => {
  const { settings, updateSettings, resetSettings } = useShopifySettings();
  
  const handleToggleFallbackMode = (checked: boolean) => {
    updateSettings({ fallbackModeOnly: checked });
    if (checked) {
      toast.info('تم تفعيل وضع Fallback Mode فقط');
    }
  };
  
  const handleToggleDebugMode = (checked: boolean) => {
    updateSettings({ debugMode: checked });
    if (checked) {
      toast.info('تم تفعيل وضع التصحيح');
    }
  };
  
  const handleToggleIgnoreMetaobjectErrors = (checked: boolean) => {
    updateSettings({ ignoreMetaobjectErrors: checked });
    if (checked) {
      toast.info('تم تفعيل تجاهل أخطاء Metaobject');
    }
  };
  
  const handleResetSettings = () => {
    resetSettings();
    toast.success('تم إعادة تعيين الإعدادات إلى القيم الافتراضية');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          إعدادات متقدمة لـ Shopify
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            هذه الإعدادات مخصصة للاستخدام المتقدم وإصلاح المشكلات. تجنب تغييرها ما لم يكن ذلك ضروريًا.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <Label htmlFor="fallback-mode" className="font-medium">وضع Fallback فقط</Label>
            <p className="text-sm text-gray-500">استخدام وصف المنتج بدلاً من Metaobject</p>
          </div>
          <Switch 
            id="fallback-mode"
            checked={settings.fallbackModeOnly}
            onCheckedChange={handleToggleFallbackMode}
          />
        </div>
        
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <Label htmlFor="debug-mode" className="font-medium">وضع التصحيح</Label>
            <p className="text-sm text-gray-500">عرض معلومات تصحيح الأخطاء المفصلة</p>
          </div>
          <Switch 
            id="debug-mode"
            checked={settings.debugMode}
            onCheckedChange={handleToggleDebugMode}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ignore-metaobject-errors" className="font-medium">تجاهل أخطاء Metaobject</Label>
            <p className="text-sm text-gray-500">تجاهل أخطاء صلاحيات Metaobject</p>
          </div>
          <Switch 
            id="ignore-metaobject-errors"
            checked={settings.ignoreMetaobjectErrors}
            onCheckedChange={handleToggleIgnoreMetaobjectErrors}
          />
        </div>
        
        {settings.fallbackModeOnly && settings.ignoreMetaobjectErrors && (
          <Alert variant="success" className="mt-4">
            <LifeBuoy className="h-4 w-4" />
            <AlertDescription>
              تم تفعيل وضع التوافق الأقصى. يجب أن يعمل النشر الآن باستخدام وصف المنتج.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={handleResetSettings}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          إعادة تعيين الإعدادات
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShopifySettings;
