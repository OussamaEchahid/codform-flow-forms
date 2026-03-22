import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
interface Props {
  shop?: string | null;
  defaultAccountId?: string | null;
  auto?: boolean; // التفعيل التلقائي عند الفتح
}
const ShopifyWebPixelActivator: React.FC<Props> = ({
  shop,
  defaultAccountId,
  auto = true
}) => {
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
    const activationKey = `codmagnet_pixel_activation_${activeStore}`;
    console.log('🟣 Activating web pixel...', {
      shop: activeStore,
      accountId
    });
    setLoading(true);
    try {
      // Call Edge Function directly to avoid JWT issues
      const SUPABASE_URL = 'https://nnwnuurkcmuvprirsfho.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/activate-web-pixel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          shop: activeStore,
          accountID: accountId?.trim() || 'codmagnet.com'
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        const detail = Array.isArray(data?.userErrors) && data.userErrors.length ? data.userErrors.map((e: any) => e.message).join('; ') : undefined;
        const msg = detail || data?.message || data?.error || `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      if (data?.success) {
        console.log('✅ Web pixel activated', data);
        localStorage.setItem(activationKey, '1');
        toast.success('تم تفعيل Web Pixel بنجاح');
      } else {
        const msg = data?.userErrors?.[0]?.message || data?.message || 'تعذر التفعيل';
        console.warn('⚠️ Activation returned non-success', data);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error('❌ Activation error', err);
      toast.error(err?.message || 'تعذر الاتصال بمتجر Shopify');
    } finally {
      setLoading(false);
    }
  };

  // تفعيل تلقائي مرة واحدة لكل متجر
  useEffect(() => {
    if (!auto || !activeStore) return;
    const activationKey = `codmagnet_pixel_activation_${activeStore}`;
    const already = localStorage.getItem(activationKey) === '1';
    if (already) return;
    handleActivate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, activeStore]);
  return null;
};
export default ShopifyWebPixelActivator;