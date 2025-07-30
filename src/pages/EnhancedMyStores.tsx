import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, ArrowRight, Plus, ExternalLink } from 'lucide-react';
import UnifiedStoreManager from '@/utils/unified-store-manager';
import { useState, useEffect } from 'react';

const EnhancedMyStores = () => {
  const [currentStore, setCurrentStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // استخدام UnifiedStoreManager كمصدر وحيد للحقيقة
    const store = UnifiedStoreManager.getActiveStore();
    const connected = UnifiedStoreManager.isConnected();
    
    console.log('🏪 EnhancedMyStores - Store from UnifiedStoreManager:', store);
    console.log('🏪 EnhancedMyStores - Is connected:', connected);
    
    setCurrentStore(store);
    setIsConnected(connected);
    setLoading(false);

    // مراقبة التغييرات
    const unsubscribe = UnifiedStoreManager.onStoreChange((newStore) => {
      console.log('🏪 EnhancedMyStores - Store changed to:', newStore);
      setCurrentStore(newStore);
      setIsConnected(!!newStore);
    });

    return unsubscribe;
  }, []);

  const switchToStore = (storeName: string) => {
    console.log('🔄 Switching to store:', storeName);
    UnifiedStoreManager.switchStore(storeName, true);
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting...');
    UnifiedStoreManager.clearActiveStore();
  };

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

  if (!isConnected) {
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
                onClick={disconnect}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                قطع الاتصال
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

        {/* Current Store Only */}
        {currentStore && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المتجر المتصل حالياً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border border-primary bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Store className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{currentStore}</h3>
                      <p className="text-xs text-slate-500">
                        متصل ونشط
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">نشط</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${currentStore}/admin`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      إدارة
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedMyStores;