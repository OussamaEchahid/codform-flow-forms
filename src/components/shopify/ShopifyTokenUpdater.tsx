
import React, { useState, useEffect } from 'react';
import { useShopify } from '@/hooks/useShopify';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminRoute } from '@/lib/shopify/admin-routes';
import { useAuth } from '@/lib/auth';

const ShopifyTokenUpdater = () => {
  const [open, setOpen] = useState(false);
  const { isConnected, tokenError, refreshConnection, shop } = useShopify();
  const { shopifyConnected } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Open dialog automatically if token error detected
    if (tokenError && shopifyConnected) {
      setOpen(true);
    }
  }, [tokenError, shopifyConnected]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshConnection();
      if (success) {
        toast.success('تم تحديث الاتصال بنجاح');
        setOpen(false);
      } else {
        toast.error('فشل تحديث الاتصال، يرجى إعادة تسجيل الدخول');
      }
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast.error('حدث خطأ أثناء تحديث الاتصال');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReconnect = () => {
    // Redirect to the Shopify auth URL
    const adminUrl = getAdminRoute('/auth', shop);
    if (adminUrl) {
      window.location.href = adminUrl;
    } else {
      toast.error('لا يمكن إنشاء رابط إعادة اتصال Shopify');
    }
  };

  if (!tokenError || !shopifyConnected) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline" 
        size="sm"
        className="mr-2"
        onClick={() => setOpen(true)}
      >
        <Wrench className="h-4 w-4 mr-2" />
        تحديث الاتصال
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">تحديث اتصال Shopify</DialogTitle>
            <DialogDescription className="mt-2 text-right">
              يبدو أن هناك مشكلة مع اتصال متجر Shopify الخاص بك. قد تحتاج إلى تحديث توكن الوصول.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-500 text-right">
              المتجر المتصل: <span className="font-medium">{shop}</span>
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                disabled={isRefreshing}
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="outline"
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                {isRefreshing ? 'جارٍ التحديث...' : 'تحديث الاتصال'}
              </Button>
              <Button
                disabled={isRefreshing}
                onClick={handleReconnect}
              >
                إعادة الاتصال بـ Shopify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShopifyTokenUpdater;
