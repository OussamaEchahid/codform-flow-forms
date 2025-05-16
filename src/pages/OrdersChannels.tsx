
import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Layers, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const OrdersChannels = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected;
  const actualShop = shop || localStorage.getItem('shopify_store');

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'قناة الويب' : 'Web Channel'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة الطلبات الواردة من موقعك الإلكتروني' : 'Manage orders coming from your website'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تفعيل' : 'Enabled'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'قناة شوبيفاي' : 'Shopify Channel'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة الطلبات الواردة من متجر شوبيفاي الخاص بك' : 'Manage orders coming from your Shopify store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تفعيل' : 'Enabled'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'الإعدادات العامة لقنوات الطلبات' : 'General Order Channels Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'قريباً: ستتمكن من إضافة المزيد من قنوات الطلبات وإدارتها من هنا' 
                  : 'Coming soon: You will be able to add more order channels and manage them from here'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrdersChannels;
