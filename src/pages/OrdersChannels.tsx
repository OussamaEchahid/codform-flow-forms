import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ShoppingBag, Settings, Sheet, Plus, TestTube } from 'lucide-react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const OrdersChannels = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const { toast } = useToast();
  const [googleSheetConfigs, setGoogleSheetConfigs] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [enableAutoImport, setEnableAutoImport] = useState<boolean>(true);
  const [formMappings, setFormMappings] = useState<Record<string, { spreadsheet_id: string; sheet_id: string; sheet_title: string }>>({});

  const [newConfig, setNewConfig] = useState({
    sheet_id: '',
    sheet_name: '',
    webhook_url: '',
    sync_orders: true,
    sync_submissions: false,
    enabled: true
  });

  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;

  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

  // Fetch Google Sheets configurations
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
          body: { action: 'list-configs' }
        });

        if (error) {
          console.error('Error fetching Google Sheets configs:', error);
        } else {
          setGoogleSheetConfigs(data?.configs || []);
        }


      } catch (error) {
        console.error('Error fetching configs:', error);
      }
    };

    if (actualHasAccess) {
      fetchConfigs();
    }

    // 1) Handle success param if this page was opened as the OAuth redirect target
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    if (success === '1' || success === 'true') {
      setGoogleConnected(true);
      refreshSpreadsheets();
      try { window.opener?.postMessage({ type: 'GOOGLE_CONNECTED' }, '*'); } catch {}
      if (window.opener) {
        setTimeout(() => window.close(), 1200);
      } else {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('success');
          window.history.replaceState({}, document.title, url.toString());
        } catch {}
      }
    }

    // 2) Listen for callback from popup to auto-refresh connection state
    const onMsg = (ev: MessageEvent) => {
      if (ev?.data?.type === 'GOOGLE_CONNECTED') {
        setGoogleConnected(true);
        refreshSpreadsheets();
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [actualHasAccess]);
  // Google OAuth and Sheets helpers
  const handleGoogleConnect = async () => {
    try {
      const redirect_uri = `${window.location.origin}/oauth/google-callback`;
      const shopId = (actualShop as string) || localStorage.getItem('active_shopify_store') || '';
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || '';
      const { data, error } = await supabase.functions.invoke('google-oauth-start', {
        body: { redirect_uri, shop_id: shopId, user_id: userId },
      });
      if (error) throw error;
      const url = (data as any)?.auth_url || (data as any)?.url || (data as any);
      if (typeof url === 'string') {
        window.open(url, '_blank');
      } else {
        console.error('Unexpected response from google-oauth-start:', data);
      }
    } catch (e) {
      console.error('Failed to start Google OAuth via edge function', e);
    }
  };

  const refreshSpreadsheets = async () => {
    try {
      const shopId = (actualShop as string) || localStorage.getItem('active_shopify_store') || '';
      const { data, error } = await supabase.functions.invoke('google-sheets-list', {
        body: { shop_id: shopId },
      });
      if (error) throw error;
      const json = data as any;
      if (json?.spreadsheets) {
        setSpreadsheets(json.spreadsheets);
        setGoogleConnected(true);
      } else if (json?.error === 'not_connected') {
        setGoogleConnected(false);
      }
    } catch (e) {
      console.error('Failed to list spreadsheets', e);
    }
  };

  const refreshSheets = async (spreadsheetId: string) => {
    try {
      const shopId = (actualShop as string) || localStorage.getItem('active_shopify_store') || '';
      const { data, error } = await supabase.functions.invoke('google-sheets-list', {
        body: { shop_id: shopId, spreadsheet_id: spreadsheetId },
      });
      if (error) throw error;
      const json = data as any;
      if (json?.sheets) {
        setSheets(json.sheets);
      }
    } catch (e) {
      console.error('Failed to list sheets', e);
    }
  };


  const handleAddGoogleSheets = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          action: 'create-config',
          ...newConfig,
          shop_id: actualShop
        }
      });

      if (error) {
        throw error;
      }

      setGoogleSheetConfigs([...googleSheetConfigs, data.config]);
      setShowAddDialog(false);
      setNewConfig({
        sheet_id: '',
        sheet_name: '',
        webhook_url: '',
        sync_orders: true,
        sync_submissions: false,
        enabled: true
      });

      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' ? 'تم إضافة تكامل Google Sheets بنجاح' : 'Google Sheets integration added successfully',
      });
    } catch (error) {
      console.error('Error adding Google Sheets config:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إضافة تكامل Google Sheets' : 'Failed to add Google Sheets integration',
        variant: 'destructive',
      });
    }
  };

  const handleTestWebhook = async (webhookUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          action: 'test-webhook',
          webhook_url: webhookUrl
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' ? 'تم اختبار الـ webhook بنجاح' : 'Webhook test successful',
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في اختبار الـ webhook' : 'Webhook test failed',
        variant: 'destructive',
      });
    }
  };

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center py-8">
          {language === 'ar'
            ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى قسم قنوات الطلبات'
            : 'Please login or connect a Shopify store to access order channels'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'قنوات الطلبات' : 'Order Channels'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Web Channel Card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {language === 'ar' ? 'قناة الويب' : 'Web Channel'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'إدارة الطلبات الواردة من موقعك الإلكتروني'
                  : 'Manage orders coming from your website'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'مفعل' : 'Active'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shopify Channel Card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {language === 'ar' ? 'قناة شوبيفاي' : 'Shopify Channel'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'إدارة الطلبات الواردة من متجر شوبيفاي'
                  : 'Manage orders from your Shopify store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${shopifyConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {shopifyConnected
                    ? (language === 'ar' ? 'متصل' : 'Connected')
                    : (language === 'ar' ? 'غير متصل' : 'Not Connected')
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Google Sheets Integration Card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sheet className="h-5 w-5" />
                {language === 'ar' ? 'تكامل Google Sheets' : 'Google Sheets Integration'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? 'ربط الطلبات والنماذج مع Google Sheets تلقائياً'
                  : 'Automatically sync orders and form submissions to Google Sheets'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'التكاملات المضافة' : 'Active Integrations'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {googleSheetConfigs.length}
                </span>
              </div>

              {googleSheetConfigs.map((config: any) => (
                <div key={config.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{config.sheet_name || 'Google Sheet'}</p>
                      <p className="text-xs text-muted-foreground">{(config.sheet_id || '').substring(0, 20)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTestWebhook(config.webhook_url)}>
                        <TestTube className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        if (!window.confirm(language === 'ar' ? 'حذف هذا التكامل؟' : 'Delete this integration?')) return;
                        try {
                          const { error } = await supabase.functions.invoke('google-sheets-sync', { body: { action: 'delete-config', config_id: config.id } });
                          if (error) throw error;
                          setGoogleSheetConfigs((prev: any) => prev.filter((c: any) => c.id !== config.id));
                          toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted', description: language === 'ar' ? 'تم حذف التكامل' : 'Integration deleted' });
                        } catch (e) {
                          console.error('Delete config failed', e);
                          toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل حذف التكامل' : 'Failed to delete integration', variant: 'destructive' });
                        }
                      }}> {language === 'ar' ? 'حذف' : 'Delete'} </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className={config.sync_orders ? 'text-green-600' : 'text-gray-400'}>
                      {language === 'ar' ? 'الطلبات' : 'Orders'}: {config.sync_orders ? '✓' : '✗'}
                    </span>
                    <span className={config.sync_submissions ? 'text-green-600' : 'text-gray-400'}>
                      {language === 'ar' ? 'النماذج' : 'Forms'}: {config.sync_submissions ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إضافة Google Sheets' : 'Add Google Sheets'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'ar' ? 'إضافة تكامل Google Sheets' : 'Add Google Sheets Integration'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'ar'
                        ? 'قم بإعداد تكامل Google Sheets لمزامنة البيانات تلقائياً'
                        : 'Set up Google Sheets integration to automatically sync data'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* 1) Connection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-sm text-muted-foreground">
                            {googleConnected
                              ? (language === 'ar' ? 'متصل بـ Google' : 'Connected to Google')
                              : (language === 'ar' ? 'غير متصل بـ Google' : 'Not connected to Google')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={handleGoogleConnect} variant={googleConnected ? 'secondary' : 'default'}>
                            {googleConnected ? (language === 'ar' ? 'إعادة الاتصال بـ Google' : 'Reconnect Google') : (language === 'ar' ? 'اتصل بحساب Google' : 'Connect Google account')}
                          </Button>
                          {googleConnected && (
                            <Button variant="outline" onClick={async () => {
                              const shopId = (actualShop as string) || localStorage.getItem('active_shopify_store') || '';
                              try {
                                const { error } = await supabase.functions.invoke('google-oauth-disconnect', { body: { shop_id: shopId } });
                                if (error) throw error;
                                setGoogleConnected(false);
                                toast({ title: language === 'ar' ? 'تم الفصل' : 'Disconnected', description: language === 'ar' ? 'تم قطع الاتصال بحساب Google' : 'Disconnected from Google' });
                              } catch (e) {
                                console.error('Disconnect failed', e);
                                toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل قطع الاتصال' : 'Failed to disconnect', variant: 'destructive' });
                              }
                            }}>{language === 'ar' ? 'قطع الاتصال' : 'Disconnect'}</Button>
                          )}
                          <Button variant="outline" onClick={refreshSpreadsheets}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="enable_auto_import" checked={enableAutoImport} onCheckedChange={setEnableAutoImport} />
                        <Label htmlFor="enable_auto_import" className="!mt-0 text-sm">
                          {language === 'ar' ? 'تفعيل الاستيراد التلقائي للطلبات إلى Google Sheets' : 'Enable automatic import of your orders on Google Sheets'}
                        </Label>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* 2) Destination (Spreadsheet / Sheet) */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">{language === 'ar' ? 'اختر الملف' : 'Select your spreadsheet'}</Label>
                        <div className="flex gap-2 mt-1">
                          <select className="flex-1 border rounded px-2 py-1" value={selectedSpreadsheet} onChange={(e) => { setSelectedSpreadsheet(e.target.value); if (e.target.value) refreshSheets(e.target.value); }}>
                            <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                            {spreadsheets.map((f: any) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <Button variant="outline" onClick={() => selectedSpreadsheet && refreshSheets(selectedSpreadsheet)}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">{language === 'ar' ? 'اختر الورقة' : 'Select your sheet'}</Label>
                        <div className="flex gap-2 mt-1">
                          <select className="flex-1 border rounded px-2 py-1" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} disabled={!selectedSpreadsheet}>
                            <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                            {sheets.map((s: any) => (
                              <option key={s.id} value={`${s.id}|${s.title}`}>{s.title}</option>
                            ))}
                          </select>
                          <Button variant="outline" onClick={() => selectedSpreadsheet && refreshSheets(selectedSpreadsheet)} disabled={!selectedSpreadsheet}>{language === 'ar' ? 'تحديث' : 'Refresh'}</Button>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* 3) Per-form routing (optional) */}
                    <div>
                      <p className="text-sm font-medium mb-2">{language === 'ar' ? 'اختيار النماذج لإرسالها إلى ورقة محددة' : 'Select which forms to sync and target sheet'}</p>
                      <div className="space-y-2 max-h-56 overflow-auto border rounded p-2">
                        {Array.isArray((window as any).cachedForms) ? (window as any).cachedForms.map((form: any) => {
                          const mapping = formMappings[form.id] || { spreadsheet_id: selectedSpreadsheet, sheet_id: selectedSheet.split('|')[0], sheet_title: selectedSheet.split('|')[1] };
                          return (
                            <div key={form.id} className="flex items-center gap-2">
                              <input type="checkbox" checked={!!formMappings[form.id]} onChange={(e) => setFormMappings((prev: any) => ({ ...prev, [form.id]: (e.target as HTMLInputElement).checked ? mapping : undefined as any }))} />
                              <span className="text-sm flex-1 truncate">{form.title}</span>
                              <select className="border rounded px-2 py-1" value={mapping.spreadsheet_id || ''} onChange={(e) => setFormMappings((prev: any) => ({ ...prev, [form.id]: { ...(prev[form.id] || {}), spreadsheet_id: (e.target as HTMLSelectElement).value } }))}>
                                <option value="">{language === 'ar' ? 'الملف' : 'Spreadsheet'}</option>
                                {spreadsheets.map((f: any) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                              </select>
                              <select className="border rounded px-2 py-1" value={mapping.sheet_id || ''} onChange={(e) => {
                                const target = e.target as HTMLSelectElement;
                                const [sid, title] = [target.value, (sheets.find((s:any)=>String(s.id)===String(target.value))||{}).title];
                                setFormMappings((prev: any) => ({ ...prev, [form.id]: { ...(prev[form.id] || {}), sheet_id: sid, sheet_title: title } }));
                              }}>
                                <option value="">{language === 'ar' ? 'الورقة' : 'Sheet'}</option>
                                {sheets.map((s: any) => (<option key={s.id} value={s.id}>{s.title}</option>))}
                              </select>
                            </div>
                          );
                        }) : (
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? 'سيتم عرض النماذج بعد تحميلها' : 'Forms will appear after loading'}</div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* 4) Optional settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sheet_id_opt" className="text-sm font-medium">{language === 'ar' ? 'معرف الجدول (اختياري)' : 'Sheet ID (optional)'}</Label>
                        <Input id="sheet_id_opt" value={newConfig.sheet_id} onChange={(e) => setNewConfig({ ...newConfig, sheet_id: e.target.value })} placeholder="1BxiMVs0..." />
                      </div>
                      <div>
                        <Label htmlFor="sheet_name" className="text-sm font-medium">{language === 'ar' ? 'اسم الورقة' : 'Sheet Name'}</Label>
                        <Input id="sheet_name" value={newConfig.sheet_name} onChange={(e) => setNewConfig({ ...newConfig, sheet_name: e.target.value })} placeholder={language === 'ar' ? 'ورقة الطلبات' : 'Orders Sheet'} />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="webhook_url" className="text-sm font-medium">{language === 'ar' ? 'رابط الـ Webhook (Zapier/Make) (اختياري)' : 'Webhook URL (Zapier/Make) (optional)'}</Label>
                        <Input id="webhook_url" value={newConfig.webhook_url} onChange={(e) => setNewConfig({ ...newConfig, webhook_url: e.target.value })} placeholder="https://hooks.zapier.com/hooks/catch/..." />
                        <p className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'يُستخدم كحل احتياطي عند عدم ضبط الملف/الورقة' : 'Used as a fallback when spreadsheet/sheet are not configured'}</p>
                      </div>
                    </div>

                    {/* 5) Sync options */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch id="sync_orders" checked={newConfig.sync_orders} onCheckedChange={(checked) => setNewConfig({ ...newConfig, sync_orders: checked as boolean })} />
                        <Label htmlFor="sync_orders" className="!mt-0">{language === 'ar' ? 'مزامنة الطلبات' : 'Sync Orders'}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="sync_submissions" checked={newConfig.sync_submissions} onCheckedChange={(checked) => setNewConfig({ ...newConfig, sync_submissions: checked as boolean })} />
                        <Label htmlFor="sync_submissions" className="!mt-0">{language === 'ar' ? 'مزامنة النماذج' : 'Sync Form Submissions'}</Label>
                      </div>
                    </div>

                    <Button onClick={handleAddGoogleSheets} className="w-full">
                      {language === 'ar' ? 'إضافة التكامل' : 'Add Integration'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrdersChannels;