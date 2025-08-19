import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2, Shield, ExternalLink, AlertTriangle } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { spamProtectionService, BlockedIP } from "@/services/SpamProtectionService";
import { getActiveShopId } from "@/utils/shop-utils";
import { Textarea } from "@/components/ui/textarea";
import SpamProtectionTest from "@/components/spam-protection/SpamProtectionTest";

const SpamSettings = () => {
  const { t, language } = useI18n();
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newRedirectUrl, setNewRedirectUrl] = useState("");
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeShop, setActiveShop] = useState<string | null>(null);

  // تحميل البيانات عند بدء تشغيل المكون
  useEffect(() => {
    const shop = getActiveShopId();
    setActiveShop(shop);
    if (shop) {
      loadBlockedIPs();
    } else {
      setIsLoading(false);
      toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
    }
  }, [language]);

  // تحميل قائمة عناوين IP المحظورة
  const loadBlockedIPs = async () => {
    try {
      setIsLoading(true);
      const ips = await spamProtectionService.getBlockedIPs();
      setBlockedIPs(ips);
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
      toast.error(language === 'ar' ? 'فشل في تحميل قائمة عناوين IP المحظورة' : 'Failed to load blocked IPs');
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة عنوان IP جديد إلى قائمة الحظر
  const addBlockedIP = async () => {
    if (!newIP.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان IP' : 'Please enter an IP address');
      return;
    }

    try {
      setIsAdding(true);
      await spamProtectionService.addBlockedIP({
        ip_address: newIP.trim(),
        reason: newReason.trim() || undefined,
        redirect_url: newRedirectUrl.trim() || undefined
      });

      toast.success(language === 'ar' ? 'تم حظر عنوان IP بنجاح' : 'IP address blocked successfully');

      // إعادة تحميل القائمة وتنظيف النموذج
      await loadBlockedIPs();
      setNewIP("");
      setNewReason("");
      setNewRedirectUrl("");
    } catch (error) {
      console.error('Error adding blocked IP:', error);
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? 'فشل في حظر عنوان IP' : 'Failed to block IP address'));
    } finally {
      setIsAdding(false);
    }
  };

  // إزالة عنوان IP من قائمة الحظر
  const removeBlockedIP = async (blockedIP: BlockedIP) => {
    try {
      await spamProtectionService.removeBlockedIP(blockedIP.id);
      toast.success(language === 'ar' ? 'تم إلغاء حظر عنوان IP بنجاح' : 'IP address unblocked successfully');
      await loadBlockedIPs();
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? 'فشل في إلغاء حظر عنوان IP' : 'Failed to unblock IP address'));
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (!activeShop) {
    return (
      <SettingsLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'لا يوجد متجر نشط' : 'No Active Shop'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'يجب أن يكون لديك متجر نشط لإدارة إعدادات حظر البريد العشوائي'
                    : 'You need an active shop to manage spam protection settings'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('spamSettings')}
            </h1>
            <p className="text-muted-foreground">{t('spamSettingsDescription')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar' ? `المتجر النشط: ${activeShop}` : `Active Shop: ${activeShop}`}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('blockIP')}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'أضف عناوين IP لمنع المستخدمين من الوصول إلى متجرك أو إرسال النماذج'
                  : 'Add IP addresses to prevent users from accessing your store or submitting forms'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-ip">{t('ipAddress')}</Label>
                    <Input
                      id="new-ip"
                      type="text"
                      placeholder="192.168.1.1 أو 2001:db8::1"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                      disabled={isAdding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-reason">
                      {language === 'ar' ? 'سبب الحظر (اختياري)' : 'Reason (Optional)'}
                    </Label>
                    <Input
                      id="new-reason"
                      type="text"
                      placeholder={language === 'ar' ? 'مثال: بريد عشوائي' : 'e.g., Spam activity'}
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      disabled={isAdding}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-redirect" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {language === 'ar' ? 'رابط إعادة التوجيه (اختياري)' : 'Redirect URL (Optional)'}
                  </Label>
                  <Input
                    id="new-redirect"
                    type="url"
                    placeholder="https://example.com/blocked"
                    value={newRedirectUrl}
                    onChange={(e) => setNewRedirectUrl(e.target.value)}
                    disabled={isAdding}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar'
                      ? 'إذا تم تحديد رابط، سيتم توجيه المستخدمين المحظورين إليه بدلاً من عرض رسالة خطأ'
                      : 'If specified, blocked users will be redirected to this URL instead of showing an error message'
                    }
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={addBlockedIP}
                    disabled={isAdding || !newIP.trim()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {isAdding
                      ? (language === 'ar' ? 'جاري الحظر...' : 'Blocking...')
                      : t('blockIP')
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('blockedIPsList')}</CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? `${blockedIPs.length} عنوان IP محظور`
                  : `${blockedIPs.length} blocked IP addresses`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </p>
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noBlockedIPs')}</p>
                  <p className="text-sm mt-2">
                    {language === 'ar'
                      ? 'أضف عناوين IP لبدء حماية متجرك من البريد العشوائي'
                      : 'Add IP addresses to start protecting your store from spam'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('ipAddress')}</TableHead>
                        <TableHead>
                          {language === 'ar' ? 'السبب' : 'Reason'}
                        </TableHead>
                        <TableHead>
                          {language === 'ar' ? 'إعادة التوجيه' : 'Redirect'}
                        </TableHead>
                        <TableHead>{t('blockDate')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedIPs.map((blockedIP) => (
                        <TableRow key={blockedIP.id}>
                          <TableCell className="font-mono font-medium">
                            {blockedIP.ip_address}
                          </TableCell>
                          <TableCell>
                            {blockedIP.reason ? (
                              <span className="text-sm">{blockedIP.reason}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {language === 'ar' ? 'غير محدد' : 'Not specified'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {blockedIP.redirect_url ? (
                              <a
                                href={blockedIP.redirect_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {language === 'ar' ? 'رابط' : 'Link'}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {language === 'ar' ? 'لا يوجد' : 'None'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(blockedIP.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeBlockedIP(blockedIP)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('removeBlock')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* مكون اختبار حماية البريد العشوائي */}
          <SpamProtectionTest />
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SpamSettings;
