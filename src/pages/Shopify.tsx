import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";
import { ShopifyIcon } from "@/components/icons/ShopifyIcon";
import { useAuth } from "@/lib/auth";

export default function Shopify() {
  const [shop, setShop] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { shopifyConnected, refreshShopifyConnection } = useAuth();
  
  // Check if we need to reconnect from params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reconnect = params.get("reconnect");
    const forceReconnect = params.get("force");
    
    if (reconnect && forceReconnect) {
      console.log("Force reconnect requested");
      // Clear any existing connection data
      localStorage.removeItem('shopify_store');
      localStorage.removeItem('shopify_connected');
      
      // Reset connection state in auth context
      if (refreshShopifyConnection) {
        refreshShopifyConnection();
      }
    }
  }, [refreshShopifyConnection]);

  // If already connected, redirect to dashboard
  useEffect(() => {
    if (shopifyConnected) {
      const savedShop = localStorage.getItem('shopify_store');
      if (savedShop) {
        console.log("Already connected to Shopify, redirecting to dashboard");
        toast({
          title: `متصل بالفعل بمتجر ${savedShop}`,
          variant: "default",
          id: 'already-connected'
        });
        navigate('/dashboard');
      }
    }
  }, [shopifyConnected, navigate, toast]);

  const handleConnect = async (method: 'direct' | 'embedded') => {
    if (!shop.trim()) {
      setError("يرجى إدخال رابط متجر Shopify الخاص بك");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      if (method === 'direct') {
        // Store temporary shop data
        localStorage.setItem('shopify_temp_store', shop);
        
        // Redirect to our edge function that handles OAuth
        const response = await fetch(
          `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-auth?shop=${encodeURIComponent(shop)}&ts=${Date.now()}`,
          { 
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA'}`
            }
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Auth response:", data);
        
        if (data.redirect) {
          // Navigate to the shopify auth URL
          window.location.href = data.redirect;
          return; // Stop execution here as we're redirecting
        } else {
          throw new Error("لم يتم توفير عنوان URL لإعادة التوجيه");
        }
      } else {
        // Embedded flow - to be implemented
        toast({
          title: "قريبا",
          description: "سيتم دعم تدفق التطبيق المضمّن قريبًا",
        });
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
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <ShopifyIcon className="h-12 w-12 text-[#95BF47]" />
          </div>
          <CardTitle className="text-2xl text-center">ربط متجر Shopify</CardTitle>
          <CardDescription className="text-center">
            قم بتوصيل متجرك بـ CODFORM للاستفادة من نماذج الطلب الأكثر تقدمًا
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>خطأ</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="mb-4">
            <Label htmlFor="shop">رابط متجر Shopify</Label>
            <div className="mt-1">
              <Input
                id="shop"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="your-store.myshopify.com"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              أدخل عنوان متجرك بتنسيق your-store.myshopify.com
            </p>
          </div>
          
          <div className="space-y-4 mt-8">
            <Button 
              onClick={() => handleConnect('direct')} 
              className="w-full bg-[#5E6EBF] hover:bg-[#4E5EAF]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  جاري الاتصال...
                </div>
              ) : (
                <>اتصال مباشر (صفحة كاملة)</>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-gray-500 text-center w-full">
            بالنقر على "اتصال"، أنت توافق على <a href="https://codform.co/terms" className="underline" target="_blank" rel="noopener noreferrer">شروط الخدمة</a> الخاصة بنا.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
