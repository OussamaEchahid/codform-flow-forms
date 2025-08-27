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

const OrderSettings = () => {
  const { t } = useI18n();
  const { settings, loading, saving, saveSettings, updateSettings } = useOrderSettings();

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
          {/* Action selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('postOrderAction')}</CardTitle>
              <CardDescription>{t('postOrderActionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant={settings.post_order_action === 'redirect' ? 'default' : 'outline'} onClick={() => handleFieldChange('post_order_action','redirect')}>
                  {t('redirectToPage')}
                </Button>
                <Button variant={settings.post_order_action === 'popup' ? 'default' : 'outline'} onClick={() => handleFieldChange('post_order_action','popup')}>
                  {t('showPopup')}
                </Button>
                <Button variant={settings.post_order_action === 'stay' ? 'default' : 'outline'} onClick={() => handleFieldChange('post_order_action','stay')}>
                  {t('stayOnPage')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Redirect config */}
          <Card>
            <CardHeader>
              <CardTitle>{t('redirectToPage')}</CardTitle>
              <CardDescription>{t('redirectToPage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
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
                    type="text"
                    placeholder="/pages/thank-you أو https://yourdomain/pages/thank-you"
                    value={settings.thank_you_page_url || ''}
                    onChange={(e) => handleFieldChange('thank_you_page_url', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">يمكنك إدخال رابط نسبي داخل المتجر (مُفضّل) أو رابط كامل.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popup config */}
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
                  placeholder={t('popupTitlePlaceholder')}
                  value={settings.popup_title || ''}
                  onChange={(e) => handleFieldChange('popup_title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-message">{t('popupMessage')}</Label>
                <Textarea
                  id="popup-message"
                  placeholder={t('popupMessagePlaceholder')}
                  value={settings.popup_message || ''}
                  onChange={(e) => handleFieldChange('popup_message', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Accent</Label>
                  <Input type="color" onChange={(e)=>{/* future style save */}} defaultValue="#9b87f5" />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input type="color" onChange={(e)=>{}} defaultValue="#111827" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Input type="color" onChange={(e)=>{}} defaultValue="#374151" />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input type="text" placeholder="مثال: ✅" defaultValue="✅" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default OrderSettings;