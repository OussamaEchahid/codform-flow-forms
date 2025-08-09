import React, { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Props {
  shop?: string | null;
  defaultAccountId?: string | null;
}

const ShopifyWebPixelActivator: React.FC<Props> = ({ shop, defaultAccountId }) => {
  const activeStore = useMemo(() => {
    return shop || localStorage.getItem('current_shopify_store') || localStorage.getItem('shopify_store') || '';
  }, [shop]);

  const [accountId, setAccountId] = useState<string>(defaultAccountId || activeStore || '');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!activeStore) {
      toast.error('لا يوجد متجر متصل حاليًا');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('activate-web-pixel', {
        body: { shop: activeStore, accountID: accountId?.trim() || activeStore }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('تم تفعيل Web Pixel بنجاح');
      } else {
        const msg = data?.userErrors?.[0]?.message || data?.message || 'تعذر التفعيل';
        toast.error(msg);
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر الاتصال بمتجر Shopify');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تفعيل Shopify Web Pixel</CardTitle>
        <CardDescription>إنشاء وتفعيل سجل App Pixel في صفحة Customer events لهذا المتجر.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!activeStore && (
          <Alert>
            <AlertDescription>يرجى توصيل متجر Shopify أولاً.</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <label className="text-sm">Account ID (اختياري)</label>
          <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={activeStore || 'account id'} />
          <p className="text-xs text-muted-foreground">إذا تركته فارغًا سنستخدم دومين المتجر كقيمة افتراضية (آمن ومناسب).</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleActivate} disabled={loading || !activeStore}>
            {loading ? 'جاري التفعيل...' : 'تفعيل البيكسل الآن'}
          </Button>
          <Button variant="outline" onClick={() => window.open('https://admin.shopify.com/store', '_blank')}>فتح Shopify Admin</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopifyWebPixelActivator;
