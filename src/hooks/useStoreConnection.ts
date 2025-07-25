import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useStoreConnection = () => {
  const [connecting, setConnecting] = useState(false);

  const linkStoreToCurrentUser = useCallback(async (shopDomain: string) => {
    try {
      setConnecting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // ربط المتجر بالمستخدم الحالي
      const { error: linkError } = await supabase
        .from('shopify_stores')
        .update({ 
          user_id: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('shop', shopDomain);

      if (linkError) {
        throw linkError;
      }

      console.log(`✅ Successfully linked ${shopDomain} to user ${session.user.id}`);
      
      toast({
        title: "تم الربط بنجاح",
        description: `تم ربط المتجر ${shopDomain} بحسابك`,
      });

      return true;
    } catch (error) {
      console.error('Error linking store:', error);
      toast({
        title: "خطأ في الربط",
        description: "فشل في ربط المتجر بحسابك",
        variant: "destructive"
      });
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  const getStoreAccessToken = useCallback(async (shopDomain: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shopDomain)
        .not('access_token', 'is', null)
        .single();

      if (error || !data) {
        return null;
      }

      return data.access_token;
    } catch (error) {
      console.error('Error getting store access token:', error);
      return null;
    }
  }, []);

  const validateStoreConnection = useCallback(async (shopDomain: string): Promise<boolean> => {
    const token = await getStoreAccessToken(shopDomain);
    return !!token && token.length > 0;
  }, [getStoreAccessToken]);

  return {
    connecting,
    linkStoreToCurrentUser,
    getStoreAccessToken,
    validateStoreConnection
  };
};