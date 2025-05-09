
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useShopifySettings } from '@/lib/shopify/ShopifySettingsProvider';

const ShopifySettings: React.FC = () => {
  const { language } = useI18n();
  const { settings, updateSettings, resetSettings } = useShopifySettings();

  const handleFallbackModeChange = (checked: boolean) => {
    updateSettings({
      fallbackModeOnly: checked
    });
  };

  const handleDebugModeChange = (checked: boolean) => {
    updateSettings({
      debugMode: checked
    });
  };

  const handleIgnoreMetaobjectErrorsChange = (checked: boolean) => {
    updateSettings({
      ignoreMetaobjectErrors: checked
    });
  };

  const handleResetSettings = () => {
    resetSettings();
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm mb-4">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="text-lg font-semibold">
          {language === 'ar' ? 'إعدادات Shopify المتقدمة' : 'Advanced Shopify Settings'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'إعدادات متقدمة للتكامل مع Shopify'
            : 'Advanced settings for Shopify integration'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-sm font-medium mb-2">
              {language === 'ar' ? 'وضع الاتصال' : 'Connection Mode'}
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium" htmlFor="fallback-mode">
                  {language === 'ar' ? 'وضع الاحتياطي فقط' : 'Fallback Mode Only'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar' 
                    ? 'استخدام طرق الاتصال البديلة فقط (تجريبي)'
                    : 'Use only fallback connection methods (experimental)'}
                </p>
              </div>
              <Switch
                id="fallback-mode"
                checked={settings.fallbackModeOnly}
                onCheckedChange={handleFallbackModeChange}
              />
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-sm font-medium mb-2">
              {language === 'ar' ? 'إعدادات التصحيح' : 'Debug Settings'}
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium" htmlFor="debug-mode">
                  {language === 'ar' ? 'وضع التصحيح' : 'Debug Mode'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'عرض سجلات التصحيح المفصلة'
                    : 'Show verbose debugging logs'}
                </p>
              </div>
              <Switch
                id="debug-mode"
                checked={settings.debugMode}
                onCheckedChange={handleDebugModeChange}
              />
            </div>
          </div>

          <div className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium" htmlFor="ignore-metaobject-errors">
                  {language === 'ar' ? 'تجاهل أخطاء Metaobject' : 'Ignore Metaobject Errors'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar'
                    ? 'متابعة النشر حتى مع وجود أخطاء في metaobject'
                    : 'Continue publishing even with metaobject errors'}
                </p>
              </div>
              <Switch
                id="ignore-metaobject-errors"
                checked={settings.ignoreMetaobjectErrors}
                onCheckedChange={handleIgnoreMetaobjectErrorsChange}
              />
            </div>
          </div>

          {(settings.fallbackModeOnly || settings.ignoreMetaobjectErrors) && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">
                    {language === 'ar' ? 'تحذير: إعدادات تجريبية نشطة' : 'Warning: Experimental settings active'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? 'قد تؤدي هذه الإعدادات إلى سلوك غير متوقع. استخدمها فقط إذا كنت تواجه مشاكل محددة.'
                      : 'These settings may cause unexpected behavior. Only use if you are experiencing specific issues.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleResetSettings}
            >
              <RefreshCw className="h-4 w-4" />
              {language === 'ar' ? 'إعادة تعيين جميع الإعدادات' : 'Reset All Settings'}
            </Button>
            <div className="text-xs text-gray-500 flex gap-2 items-center">
              <Info className="h-3 w-3" />
              {language === 'ar'
                ? 'ستتم إعادة تعيين جميع الإعدادات إلى قيمها الافتراضية'
                : 'This will reset all settings to their default values'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifySettings;
