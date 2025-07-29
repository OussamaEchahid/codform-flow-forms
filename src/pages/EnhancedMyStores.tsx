import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ExternalLink, 
  Store as StoreIcon, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Power,
  ArrowLeft,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { useShopifyStores } from '@/hooks/useShopifyStores';
import AppSidebar from '@/components/layout/AppSidebar';

const EnhancedMyStores = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { 
    stores, 
    activeStore, 
    isLoading, 
    error, 
    switchStore, 
    refreshStores,
    totalStores,
    isConnected 
  } = useShopifyStores();

  const handleSwitchStore = async (shopDomain: string) => {
    const success = await switchStore(shopDomain);
    if (success) {
      toast({
        title: "تم التبديل بنجاح",
        description: `تم التبديل إلى ${shopDomain}`,
      });
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      toast({
        title: "خطأ في التبديل",
        description: "فشل في التبديل إلى المتجر",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل المتاجر...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة إلى لوحة التحكم
          </Button>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">متاجري ({totalStores})</h1>
              <p className="text-muted-foreground">إدارة متاجر Shopify المرتبطة بحسابك</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshStores} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
              <Button onClick={() => navigate('/shopify-stores')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                ربط متجر جديد
              </Button>
            </div>
          </div>

          {activeStore && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>متصل بـ:</strong> {activeStore}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const isCurrentStore = store.shop === activeStore;
              return (
                <Card key={store.shop} className={`transition-all hover:shadow-lg ${isCurrentStore ? 'border-green-500 bg-green-50' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <StoreIcon className="h-5 w-5 text-blue-600" />
                      <div className="flex gap-2">
                        {isCurrentStore && (
                          <Badge variant="default" className="bg-green-600">نشط</Badge>
                        )}
                        <Badge variant="default" className="bg-blue-600">متصل</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{store.shop}</CardTitle>
                    <CardDescription>
                      آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar-EG')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isCurrentStore ? (
                      <Button variant="outline" disabled className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        متصل حالياً
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSwitchStore(store.shop)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        تبديل إليه
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {stores.length === 0 && (
            <div className="text-center py-12">
              <StoreIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد متاجر مضافة</h3>
              <p className="text-muted-foreground mb-6">ابدأ بربط أول متجر Shopify لحسابك</p>
              <Button onClick={() => navigate('/shopify-stores')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                ربط متجر جديد
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMyStores;