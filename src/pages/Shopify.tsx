
import { useState, useEffect, useCallback } from "react";
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
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const navigate = useNavigate();
  const { shopifyConnected, shop: connectedShop, refreshShopifyConnection } = useAuth();
  
  // معالج للمحاولات المتكررة
  const cleanupSessionState = useCallback(() => {
    sessionStorage.removeItem('shopify_connecting');
    sessionStorage.removeItem('shopify_redirect_attempts');
    sessionStorage.removeItem('shopify_callback_attempts');
  }, []);
  
  // معالجة معلمات URL والاتصال الحالي
  useEffect(() => {
    console.log("Shopify page mounted, checking parameters");
    cleanupSessionState();
    
    const params = new URLSearchParams(window.location.search);
    const forceReconnect = params.get("force") === "true";
    const shopParam = params.get("shop");
    
    // تعيين القيمة الموجودة بشكل افتراضي إذا كنا متصلين بالفعل
    if (shopifyConnected && connectedShop) {
      console.log(`Already connected to ${connectedShop}, showing reconnect option`);
      setShop(connectedShop);
    } 
    // إذا كان لدينا معلمة متجر، استخدمها لملء الحقل
    else if (shopParam) {
      setShop(shopParam);
    }
    // محاولة استرداد المتجر المخزن
    else {
      const tempShop = localStorage.getItem('shopify_temp_store');
      if (tempShop) {
        setShop(tempShop);
      } else if (localStorage.getItem('shopify_store')) {
        setShop(localStorage.getItem('shopify_store') || '');
      }
    }
    
    // إذا كانت إعادة الاتصال القسرية محددة، امسح بيانات الاتصال
    if (forceReconnect) {
      console.log("Force reconnect requested, clearing connection data");
      
      // مسح بيانات اتصال Shopify
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      localStorage.removeItem('shopify_temp_store');
      localStorage.removeItem('shopify_last_connect_time');
      
      // إعادة تعيين حالة إعادة المحاولة
      localStorage.setItem('shopify_connection_attempts', '0');
      
      // تحديث سياق المصادقة
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
    }
    
    // تنظيف معلمات URL
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // تأخير قصير ثم التحقق مما إذا كنا متصلين بالفعل
    setTimeout(() => {
      setIsCheckingConnection(false);
    }, 500);
  }, [refreshShopifyConnection, shopifyConnected, connectedShop, cleanupSessionState]);

  // نهج اتصال OAuth المباشر - أكثر موثوقية
  const handleConnect = async () => {
    if (!shop.trim()) {
      setError("يرجى إدخال رابط متجر Shopify الخاص بك");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // تنظيف حالات الجلسة
      cleanupSessionState();
      
      // تخزين بيانات المتجر المؤقتة
      localStorage.setItem('shopify_temp_store', shop);
      localStorage.setItem('shopify_last_connect_time', Date.now().toString());
      
      // إضافة طابع زمني وقيمة عشوائية لتجنب التخزين المؤقت
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      
      // إظهار نخبة للمستخدم
      toast.info("جاري الاتصال بـ Shopify...");
      
      try {
        // استدعاء واجهة برمجة تطبيقات اتصال Shopify
        const authEndpointUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shop)}&ts=${timestamp}&r=${randomStr}&client=${encodeURIComponent(window.location.origin)}&debug=true`;
        
        console.log("Calling auth endpoint:", authEndpointUrl);
        
        // وضع علامة على الاتصال الجاري
        sessionStorage.setItem('shopify_connecting', 'true');
        sessionStorage.setItem('shopify_connecting_time', Date.now().toString());
        
        const response = await fetch(authEndpointUrl, { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA`,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Auth endpoint error:", errorText);
          throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Auth endpoint response:", data);
        
        if (data.redirect) {
          // تسجيل إعادة التوجيه
          console.log(`Redirecting to Shopify OAuth URL: ${data.redirect}`);
          
          // تأكد من إكمال أي وظائف متزامنة قبل إعادة التوجيه
          setTimeout(() => {
            // إظهار نخبة نجاح
            toast.success("جاري توجيهك إلى Shopify...", { duration: 3000 });
            
            // إعادة التوجيه إلى صفحة مصادقة Shopify
            window.location.href = data.redirect;
          }, 500);
          
          return; // إيقاف التنفيذ هنا
        } else if (data.success && data.hasExistingToken) {
          // تعامل مع الحالة التي يكون فيها لدينا رمز وصول موجود
          console.log("Found existing access token, redirecting to dashboard");
          
          // تخزين بيانات المتجر
          localStorage.setItem('shopify_store', data.shop);
          localStorage.setItem('shopify_connected', 'true');
          localStorage.setItem('shopify_last_connect_time', Date.now().toString());
          
          // تحديث سياق المصادقة
          if (refreshShopifyConnection) {
            refreshShopifyConnection();
          }
          
          // إظهار نخبة نجاح
          toast.success(`تم الاتصال بنجاح بمتجر ${data.shop}`);
          
          // إعادة التوجيه إلى لوحة التحكم
          window.location.href = data.redirect;
          return;
        } else {
          throw new Error("لم يتم توفير عنوان URL لإعادة التوجيه");
        }
      } catch (fetchError) {
        console.error("Auth endpoint error:", fetchError);
        
        // جرب النهج الاحتياطي
        console.log("Using fallback redirect method");
        
        // إظهار نخبة للمستخدم
        toast.info("جاري استخدام طريقة بديلة للاتصال...");
        
        // استخدم مسار auth المضمن
        setTimeout(() => {
          window.location.href = `/auth?shop=${encodeURIComponent(shop)}&ts=${timestamp}&r=${randomStr}&force=true`;
        }, 1000);
      }
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء محاولة الاتصال");
      toast.error("فشل الاتصال بـ Shopify. يرجى المحاولة مرة أخرى.");
      
      // مسح حالة الاتصال الجارية
      cleanupSessionState();
    } finally {
      // إعادة تعيين حالة التحميل بعد تأخير للسماح بإعادة التوجيه
      setTimeout(() => {
        setIsLoading(false);
      }, 5000);
    }
  };

  // إذا كنا متصلين بالفعل، اعرض خيار إعادة الاتصال
  if (!isCheckingConnection && shopifyConnected && connectedShop) {
    return (
      <div className="container mx-auto max-w-md py-12" dir="rtl">
        <Card className="shadow-lg border-green-100">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <ShopifyIcon className="h-16 w-16 text-[#95BF47]" />
            </div>
            <CardTitle className="text-2xl text-center">متصل بـ Shopify</CardTitle>
            <CardDescription className="text-center text-lg">
              أنت متصل حاليًا بمتجر {connectedShop}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm text-green-700">
                    تم الاتصال بنجاح بمتجرك. يمكنك الآن استخدام جميع ميزات التكامل مع Shopify.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="bg-gray-500 hover:bg-gray-600"
              >
                العودة للوحة التحكم
              </Button>
              <Button 
                onClick={() => {
                  // مسح بيانات الاتصال
                  localStorage.removeItem('shopify_store');
                  localStorage.removeItem('shopify_connected');
                  localStorage.removeItem('shopify_temp_store');
                  localStorage.removeItem('shopify_last_connect_time');
                  
                  // مسح حالات الجلسة
                  cleanupSessionState();
                  
                  // تحديث سياق المصادقة
                  if (refreshShopifyConnection) {
                    refreshShopifyConnection();
                  }
                  
                  // إعادة تحميل الصفحة
                  window.location.reload();
                }} 
                variant="outline"
              >
                إعادة الاتصال
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              onClick={handleConnect} 
              className="w-full bg-[#5E6EBF] hover:bg-[#4E5EAF] h-14 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  جاري الاتصال...
                </div>
              ) : (
                <>الاتصال بمتجر Shopify</>
              )}
            </Button>
            
            {/* إضافة زر احتياطي للمساعدة في حل مشكلات الاتصال */}
            {!isLoading && (
              <div className="text-center mt-4">
                <button 
                  onClick={() => {
                    cleanupSessionState();
                    window.location.href = `/auth?shop=bestform-app.myshopify.com&force=true&ts=${Date.now()}`;
                  }}
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  استخدام المتجر الافتراضي (bestform-app.myshopify.com)
                </button>
              </div>
            )}
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
