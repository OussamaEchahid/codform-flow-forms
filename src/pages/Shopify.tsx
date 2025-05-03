
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Store, ArrowRight, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ShopifyDebugPanel } from '@/components/shopify/ShopifyDebugPanel';
import { ShopifyStoresManager } from '@/components/shopify/ShopifyStoresManager';
import { useAuth } from '@/lib/auth';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { toast } from 'sonner';

const Shopify = () => {
  const navigate = useNavigate();
  const [shopUrl, setShopUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resetConnections, setResetConnections] = useState<boolean>(false);
  const { shopifyConnected, shop, setShop } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedShop, setConnectedShop] = useState<string | null>(null);
  
  // عند تحميل الصفحة، تحقق من حالة الاتصال بـ Shopify
  useEffect(() => {
    // استخدام مكتبة الاتصال للحصول على حالة الاتصال
    const activeStore = shopifyConnectionManager.getActiveStore();
    
    setIsConnected(!!activeStore || !!shop || shopifyConnected);
    setConnectedShop(activeStore || shop);
    
    // حفظ القيمة الأولية للمتجر
    const lastUrlShop = shopifyConnectionManager.getLastUrlShop() || activeStore;
    if (lastUrlShop && !shopUrl) {
      setShopUrl(lastUrlShop);
    }
    
    // Synchronize connection state
    if (activeStore && setShop && !shopifyConnected) {
      console.log("Synchronizing connection state with AuthProvider");
      setShop(activeStore);
    }
  }, [shop, shopifyConnected, setShop]);
  
  // وظيفة للاتصال بـ Shopify
  const connectToShopify = async (usePopup = false) => {
    if (!shopUrl || shopUrl.trim() === '') {
      toast.error('الرجاء إدخال عنوان متجر Shopify');
      return;
    }
    
    setLoading(true);
    
    try {
      // تخزين عنوان المتجر للاستخدام المستقبلي
      shopifyConnectionManager.saveLastUrlShop(shopUrl);
      
      // Update local state immediately to improve user experience
      shopifyConnectionManager.addOrUpdateStore(shopUrl, true, resetConnections);
      if (setShop) {
        setShop(shopUrl);
      }
      
      // تحديد URL الاستدعاء المرتد بناءً على ما إذا كنا نستخدم نافذة منبثقة أم لا
      let redirectUrl = `${window.location.origin}/shopify-redirect?shop=${encodeURIComponent(shopUrl)}`;
      
      if (resetConnections) {
        redirectUrl += '&force_update=true';
      }
      
      if (usePopup) {
        redirectUrl += '&popup=true';
        
        // فتح نافذة منبثقة
        const popupWidth = 800;
        const popupHeight = 600;
        const left = (window.screen.width - popupWidth) / 2;
        const top = (window.screen.height - popupHeight) / 2;
        
        const popup = window.open(
          redirectUrl, 
          'ShopifyConnect',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},location=yes,toolbar=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );
        
        if (!popup || popup.closed) {
          toast.error('تم حظر النوافذ المنبثقة. الرجاء السماح بالنوافذ المنبثقة لهذا الموقع.');
          setLoading(false);
          return;
        }
        
        // إعداد مستمع للرسائل من النافذة المنبثقة
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'shopify:auth:success') {
            // تم المصادقة بنجاح، قم بتحديث الحالة
            setIsConnected(true);
            setConnectedShop(event.data.shop);
            toast.success('تم الاتصال بمتجر Shopify بنجاح');
            
            // إزالة المستمع
            window.removeEventListener('message', messageHandler);
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          }
        };
        
        window.addEventListener('message', messageHandler);
      } else {
        // استخدام إعادة التوجيه المباشر
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Error initiating Shopify connection:', error);
      toast.error('حدث خطأ أثناء محاولة الاتصال بـ Shopify');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleResetConnection = () => {
    setIsConnected(false);
    setConnectedShop(null);
    // Also reset in AuthContext if possible
    if (setShop) {
      setShop("");
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">Shopify Integration</h1>
      
      <div className="grid gap-6">
        {isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-green-500" />
                <span>Successfully Connected</span>
              </CardTitle>
              <CardDescription>
                You are connected to store: {connectedShop}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleResetConnection}>
                Reset Connection
              </Button>
              <Button onClick={handleGoToDashboard}>
                Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Connect Shopify Store
              </CardTitle>
              <CardDescription>
                Connect your Shopify store to use all the Cash on Delivery form integration features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="shopify-store" className="block text-sm font-medium mb-1">
                    Enter your Shopify store domain
                  </label>
                  <Input
                    id="shopify-store"
                    placeholder="your-store.myshopify.com"
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    className="text-left"
                    dir="ltr"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reset-connections"
                    checked={resetConnections}
                    onCheckedChange={(checked) => setResetConnections(checked as boolean)}
                  />
                  <label
                    htmlFor="reset-connections"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    إعادة ضبط جميع الاتصالات السابقة وتجاوز استخدام هذا المتجر فقط
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => connectToShopify(true)}
                disabled={loading}
              >
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect with Popup
              </Button>
              
              <Button 
                className="w-full" 
                onClick={() => connectToShopify(false)}
                disabled={loading}
              >
                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                Direct Connect (Full Page)
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <Tabs defaultValue="stores">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stores">المتاجر المتصلة</TabsTrigger>
            <TabsTrigger value="debug">معلومات التصحيح</TabsTrigger>
          </TabsList>
          <TabsContent value="stores" className="p-4 border rounded-md mt-2">
            <ShopifyStoresManager />
          </TabsContent>
          <TabsContent value="debug" className="p-4 border rounded-md mt-2">
            <ShopifyDebugPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Shopify;
