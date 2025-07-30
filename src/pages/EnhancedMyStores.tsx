import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, ArrowRight, Plus, ExternalLink } from 'lucide-react';
import { useShopifyStoreSync } from '@/hooks/useShopifyStoreSync';

const EnhancedMyStores = () => {
  const { 
    stores, 
    loading, 
    currentStore, 
    switchToStore, 
    disconnectAll 
  } = useShopifyStoreSync();

  // Get user email from localStorage
  const userEmail = localStorage.getItem('shopify_user_email');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل متاجرك...</p>
        </div>
      </div>
    );
  }

  if (!currentStore || stores.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800">
              🏪 متاجرك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-slate-600">
              لا توجد متاجر متصلة بحسابك حالياً
            </p>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://admin.shopify.com', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              فتح Shopify Admin
            </Button>
            
            <p className="text-xs text-slate-500">
              يرجى فتح التطبيق من داخل متجرك في Shopify
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
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
                  متاجري
                </CardTitle>
                 <p className="text-sm text-slate-500">
                   المتجر النشط: {currentStore || 'لا يوجد'}
                 </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectAll}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                قطع الاتصال من جميع المتاجر
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Current Store */}
        {currentStore && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg text-primary">
                المتجر النشط حالياً
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
                    <Badge variant="secondary" className="mt-1">نشط</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://${currentStore}/admin`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  فتح لوحة التحكم
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Connected Stores */}
        {stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">جميع متاجرك المتصلة ({stores.length})</CardTitle>
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
                            آخر تحديث: {new Date(store.updated_at).toLocaleDateString('ar')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {store.shop === currentStore ? (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => switchToStore(store.shop)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            تفعيل
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${store.shop}/admin`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          إدارة
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
  );
};

export default EnhancedMyStores;