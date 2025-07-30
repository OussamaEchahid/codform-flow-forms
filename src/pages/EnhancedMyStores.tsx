import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, ArrowRight, Plus, ExternalLink } from 'lucide-react';
import { useShopifyStoreSync } from '@/hooks/useShopifyStoreSync';
import { useI18n } from '@/lib/i18n';
import AppSidebar from '@/components/layout/AppSidebar';

const EnhancedMyStores = () => {
  const { 
    stores, 
    loading, 
    currentStore, 
    switchToStore, 
    disconnectAll 
  } = useShopifyStoreSync();
  const { language, t } = useI18n();

  // Get user email from localStorage
  const userEmail = localStorage.getItem('shopify_user_email');

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">{language === 'ar' ? 'جاري تحميل متاجرك...' : 'Loading your stores...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStore || stores.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-800">
                🏪 {t('yourStores')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-slate-600">
                {t('noStoresConnected')}
              </p>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://admin.shopify.com', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('openShopifyAdmin')}
              </Button>
              
              <p className="text-xs text-slate-500">
                {t('pleaseOpenFromShopify')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <AppSidebar />
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info Header */}
          {userEmail && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3 bg-white/70 px-4 py-2 rounded-full">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {userEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Store className="w-6 h-6" />
                    {t('myStores')}
                  </CardTitle>
                   <p className="text-sm text-slate-500">
                     {language === 'ar' ? 'المتجر النشط: ' : 'Active store: '}{currentStore || (language === 'ar' ? 'لا يوجد' : 'None')}
                   </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectAll}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {t('disconnectAllStores')}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Current Store */}
        {currentStore && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg text-primary">
                {t('currentActiveStore')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{currentStore}</h3>
                    <Badge variant="secondary" className="mt-1">{t('active')}</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://${currentStore}/admin`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'فتح لوحة التحكم' : 'Open Dashboard'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Connected Stores */}
        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('allConnectedStores')} ({stores.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stores.map((store) => (
                  <div 
                    key={store.shop}
                    className={`p-4 rounded-lg border ${
                      store.shop === currentStore 
                        ? 'border-primary bg-primary/5' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{store.shop}</h3>
                          <p className="text-xs text-slate-500">
                            {t('lastUpdate')}: {new Date(store.updated_at).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {store.shop === currentStore ? (
                          <Badge className="bg-green-100 text-green-800">{t('active')}</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => switchToStore(store.shop)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            {t('activate')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${store.shop}/admin`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {t('manage')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMyStores;