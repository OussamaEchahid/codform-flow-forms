
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ShopifyIcon } from "@/components/icons/ShopifyIcon";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function Shopify() {
  const [shop, setShop] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const navigate = useNavigate();
  const { shopifyConnected, refreshShopifyConnection } = useAuth();
  
  // معالجة إعادة التوصيل من المعلمات
  useEffect(() => {
    console.log("Shopify page mounted, checking for reconnect params");
    const params = new URLSearchParams(window.location.search);
    const reconnect = params.get("reconnect");
    const forceReconnect = params.get("force");
    
    if (reconnect && forceReconnect) {
      console.log("Force reconnect requested, clearing connection data");
      
      // مسح جميع بيانات الاتصال
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_connect_time');
      localStorage.removeItem('shopify_reconnect_attempts');
      
      // إعادة تعيين حالة الاتصال في سياق المصادقة
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
      
      // مسح معلمات إعادة التوجيه من URL
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [refreshShopifyConnection]);

  // إذا كان متصلاً بالفعل، قم بالتوجيه إلى لوحة التحكم
  useEffect(() => {
    if (shopifyConnected) {
      const savedShop = localStorage.getItem('shopify_store');
      if (savedShop) {
        console.log("Already connected to Shopify, redirecting to dashboard");
        
        toast(`متصل بالفعل بمتجر ${savedShop}`);
        
        navigate('/dashboard');
      }
    }
  }, [shopifyConnected, navigate]);

  const handleConnect = async (method: 'direct' | 'embedded') => {
    if (!shop.trim()) {
      setError("يرجى إدخال رابط متجر Shopify الخاص بك");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (method === 'direct') {
        // تخزين بيانات المتجر المؤقتة
        localStorage.setItem('shopify_temp_store', shop);
        localStorage.setItem('shopify_last_connect_time', Date.now().toString());
        
        // تسجيل المعلومات للتصحيح
        const debugInfo = {
          timestamp: new Date().toISOString(),
          shop,
          connectMethod: method,
          userAgent: navigator.userAgent,
          windowLocation: window.location.href,
          localStorage: {
            shopify_temp_store: localStorage.getItem('shopify_temp_store'),
            shopify_store: localStorage.getItem('shopify_store'),
            shopify_connected: localStorage.getItem('shopify_connected')
          }
        };
        console.log("Connection debug info:", debugInfo);
        setDebug(debugInfo);
        
        // التوجيه إلى دالة Edge التي تتعامل مع OAuth
        const authEndpointUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shop)}&ts=${Date.now()}&client=${encodeURIComponent(window.location.origin)}`;
        
        console.log("Redirecting to auth endpoint:", authEndpointUrl);
        
        try {
          // استدعاء نقطة نهاية المصادقة للحصول على عنوان URL لإعادة التوجيه
          const response = await fetch(authEndpointUrl, { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA`
            },
            cache: 'no-store'
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Auth endpoint error response:", errorText);
            throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Auth endpoint response:", data);
          
          if (data.redirect) {
            // تسجيل عملية إعادة التوجيه
            console.log(`Redirecting to Shopify OAuth URL: ${data.redirect}`);
            
            // التوجيه مباشرة إلى عنوان URL الخاص بـ Shopify
            window.location.href = data.redirect;
            return; // إيقاف التنفيذ هنا لأننا نقوم بإعادة توجيه
          } else {
            throw new Error("لم يتم توفير عنوان URL لإعادة التوجيه");
          }
        } catch (fetchError) {
          console.error("Auth endpoint fetch error:", fetchError);
          
          // محاولة استخدام صفحة التوجيه الوسيطة
          console.log("Trying redirect page as fallback");
          
          localStorage.setItem('shopify_temp_store', shop);
          window.location.href = `/shopify-redirect?shop=${encodeURIComponent(shop)}&ts=${Date.now()}`;
        }
      } else {
        // التدفق المضمّن - سيتم تنفيذه لاحقًا
        toast("سيتم دعم تدفق التطبيق المضمّن قريبًا");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء محاولة الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-12" dir="rtl">
      <Card className="w-full shadow-lg border-purple-100">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShopifyIcon className="h-16 w-16 text-[#95BF47]" />
          </div>
          <CardTitle className="text-2xl text-center">ربط متجر Shopify</CardTitle>
          <CardDescription className="text-center text-lg">
            قم بتوصيل متجرك بـ CODFORM للاستفادة من نماذج الطلب الأكثر تقدمًا
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold">خطأ</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6">
            <Label htmlFor="shop" className="text-lg mb-2 block">رابط متجر Shopify</Label>
            <div className="mt-1">
              <Input
                id="shop"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="your-store.myshopify.com"
                disabled={isLoading}
                className="text-lg p-5 h-14"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              أدخل عنوان متجرك بتنسيق your-store.myshopify.com
            </p>
          </div>
          
          <div className="space-y-4 mt-8">
            <Button 
              onClick={() => handleConnect('direct')} 
              className="w-full bg-[#5E6EBF] hover:bg-[#4E5EAF] h-14 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  جاري الاتصال...
                </div>
              ) : (
                <>اتصال مباشر</>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 bg-slate-50 rounded-b-lg p-4">
          <div className="text-sm text-gray-500 text-center w-full">
            بالنقر على "اتصال"، أنت توافق على <a href="https://codform.co/terms" className="underline text-[#5E6EBF]" target="_blank" rel="noopener noreferrer">شروط الخدمة</a> الخاصة بنا.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
