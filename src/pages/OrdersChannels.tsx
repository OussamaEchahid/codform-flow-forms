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
  }, [actualHasAccess]);

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
                      <p className="text-xs text-muted-foreground">{config.sheet_id.substring(0, 20)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestWebhook(config.webhook_url)}
                      >
                        <TestTube className="h-3 w-3" />
                      </Button>
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sheet_id">
                        {language === 'ar' ? 'معرف الجدول' : 'Sheet ID'}
                      </Label>
                      <Input
                        id="sheet_id"
                        value={newConfig.sheet_id}
                        onChange={(e) => setNewConfig({...newConfig, sheet_id: e.target.value})}
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sheet_name">
                        {language === 'ar' ? 'اسم الجدول' : 'Sheet Name'}
                      </Label>
                      <Input
                        id="sheet_name"
                        value={newConfig.sheet_name}
                        onChange={(e) => setNewConfig({...newConfig, sheet_name: e.target.value})}
                        placeholder={language === 'ar' ? 'ورقة الطلبات' : 'Orders Sheet'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook_url">
                        {language === 'ar' ? 'رابط الـ Webhook (Zapier/Make)' : 'Webhook URL (Zapier/Make)'}
                      </Label>
                      <Input
                        id="webhook_url"
                        value={newConfig.webhook_url}
                        onChange={(e) => setNewConfig({...newConfig, webhook_url: e.target.value})}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sync_orders"
                        checked={newConfig.sync_orders}
                        onCheckedChange={(checked) => setNewConfig({...newConfig, sync_orders: checked})}
                      />
                      <Label htmlFor="sync_orders">
                        {language === 'ar' ? 'مزامنة الطلبات' : 'Sync Orders'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sync_submissions"
                        checked={newConfig.sync_submissions}
                        onCheckedChange={(checked) => setNewConfig({...newConfig, sync_submissions: checked})}
                      />
                      <Label htmlFor="sync_submissions">
                        {language === 'ar' ? 'مزامنة النماذج' : 'Sync Form Submissions'}
                      </Label>
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