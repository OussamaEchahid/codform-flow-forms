import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { useOrderSettings } from "@/hooks/useOrderSettings";
import { useSimpleShopifyAuth } from "@/hooks/useSimpleShopifyAuth";

const OrderSettings = () => {
  const { t } = useI18n();
  const { currentStore } = useSimpleShopifyAuth();
  const { settings, loading, saving, saveSettings, updateSettings } = useOrderSettings(currentStore || '');

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    updateSettings({ [field]: value });
  };

  if (loading) {
    return (
      <SettingsLayout>
        <div className="container mx-auto p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SettingsLayout>
    );
  }

  if (!settings) {
    return (
      <SettingsLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <p>فشل في تحميل الإعدادات</p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('orderSettings')}</h1>
            <p className="text-muted-foreground">{t('orderSettingsDescription')}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('saveSettings')}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('postOrderAction')}</CardTitle>
              <CardDescription>{t('postOrderActionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-order-action">{t('postOrderAction')}</Label>
                <Select 
                  value={settings.post_order_action} 
                  onValueChange={(value) => handleFieldChange('post_order_action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('postOrderAction')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redirect">إعادة التوجيه</SelectItem>
                    <SelectItem value="popup">نافذة منبثقة</SelectItem>
                    <SelectItem value="stay">البقاء في الصفحة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('redirectToPage')}</CardTitle>
              <CardDescription>{t('redirectToPage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="redirect-enabled" 
                  checked={settings.redirect_enabled} 
                  onCheckedChange={(checked) => handleFieldChange('redirect_enabled', checked)}
                />
                <Label htmlFor="redirect-enabled">{t('redirectEnabled')}</Label>
              </div>
              
              {settings.redirect_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="thank-you-url">{t('thankYouPageUrl')}</Label>
                  <Input
                    id="thank-you-url"
                    type="url"
                    placeholder="https://example.com/thank-you"
                    value={settings.thank_you_page_url || ''}
                    onChange={(e) => handleFieldChange('thank_you_page_url', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('popupSettings')}</CardTitle>
              <CardDescription>{t('popupSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-title">{t('popupTitle')}</Label>
                <Input
                  id="popup-title"
                  placeholder="تم إنشاء طلبك بنجاح!"
                  value={settings.popup_title || ''}
                  onChange={(e) => handleFieldChange('popup_title', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="popup-message">{t('popupMessage')}</Label>
                <Textarea
                  id="popup-message"
                  placeholder="شكراً لك على طلبك. سنتواصل معك قريباً..."
                  value={settings.popup_message || ''}
                  onChange={(e) => handleFieldChange('popup_message', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default OrderSettings;