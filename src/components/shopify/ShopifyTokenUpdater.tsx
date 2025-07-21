import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { shopifyStores } from '@/lib/shopify/supabase-client';
import { toast } from 'sonner';
import { RefreshCw, Key, CheckCircle } from 'lucide-react';

interface ShopifyTokenUpdaterProps {
  shop: string;
  onTokenUpdated?: () => void;
}

export const ShopifyTokenUpdater: React.FC<ShopifyTokenUpdaterProps> = ({ shop, onTokenUpdated }) => {
  const [token, setToken] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTokenUpdate = async () => {
    if (!token.trim()) {
      toast.error('يرجى إدخال رمز الوصول');
      return;
    }

    setIsUpdating(true);
    try {
      // تحديث الرمز في قاعدة البيانات
      const { error } = await shopifyStores()
        .update({ 
          access_token: token.trim(), 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shop);

      if (error) {
        throw new Error(`فشل في تحديث الرمز: ${error.message}`);
      }

      // حفظ الرمز في localStorage كنسخة احتياطية
      localStorage.setItem(`shopify_token_${shop}`, token.trim());
      localStorage.setItem('shopify_connected', 'true');
      localStorage.setItem('shopify_active_store', shop);

      setTestResult({ success: true, message: 'تم تحديث رمز الوصول بنجاح' });
      toast.success('تم تحديث رمز الوصول بنجاح');
      
      onTokenUpdated?.();
    } catch (error) {
      console.error('Error updating token:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير متوقع';
      setTestResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestoreFromBackup = () => {
    const storedToken = localStorage.getItem(`shopify_token_${shop}`);
    if (storedToken && storedToken !== 'null') {
      setToken(storedToken);
      toast.info('تم استعادة الرمز من النسخة الاحتياطية');
    } else {
      toast.error('لا توجد نسخة احتياطية للرمز');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          تحديث رمز الوصول
        </CardTitle>
        <CardDescription>
          تحديث رمز الوصول للمتجر: {shop}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">رمز الوصول (Access Token)</Label>
          <Input
            id="token"
            type="password"
            placeholder="shpat_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono"
          />
        </div>

        {testResult && (
          <Alert className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <AlertDescription className="flex items-center gap-2">
              {testResult.success && <CheckCircle className="h-4 w-4 text-green-600" />}
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleTokenUpdate}
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              'تحديث الرمز'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRestoreFromBackup}
            disabled={isUpdating}
          >
            استعادة
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>يمكنك الحصول على رمز الوصول من:</p>
          <p className="mt-1">
            لوحة تحكم Shopify → Apps → Private apps → {shop}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyTokenUpdater;