import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSpamProtectionGuard } from '@/hooks/useSpamProtection';
import { Card, CardContent } from "@/components/ui/card";
import ShopifyProductsList from '@/components/shopify/ShopifyProductsList';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ShopifyProductView = () => {
  // تطبيق حماية البريد العشوائي
  useSpamProtectionGuard();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get the active shop from connection manager
    const activeShop = shopifyConnectionManager.getActiveStore();
    setShop(activeShop);

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!activeShop) {
          throw new Error("لا يوجد متجر نشط متصل");
        }
        
        // Fetch products via Edge Function without exposing tokens
        const { data: efData, error: efError } = await supabase.functions.invoke('shopify-products-fixed', {
          body: { shop: activeShop }
        });

        if (efError) {
          throw efError;
        }
        if (!efData || efData.success === false) {
          throw new Error(efData?.message || 'فشل في جلب المنتجات');
        }

        setProducts(efData.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب المنتجات");
        toast.error("فشل في جلب المنتجات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  
  const handleReconnect = () => {
    navigate('/shopify');
  };

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">منتجات المتجر</h1>
      
      {shop && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border">
          <p className="text-sm text-gray-600">المتجر المتصل: <span className="font-medium">{shop}</span></p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="mr-3">جاري تحميل المنتجات...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <p className="text-gray-600">تأكد من اتصالك بمتجر Shopify بشكل صحيح</p>
              <Button onClick={handleReconnect}>إعادة الاتصال بالمتجر</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ShopifyProductsList products={products} />
      )}
    </div>
  );
};

export default ShopifyProductView;
