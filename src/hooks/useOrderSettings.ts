import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderSettings {
  id?: string;
  shop_id: string;
  user_id?: string;
  post_order_action: 'redirect' | 'popup' | 'stay';
  redirect_enabled: boolean;
  thank_you_page_url?: string;
  popup_title?: string;
  popup_message?: string;
  created_at?: string;
  updated_at?: string;
}

export const useOrderSettings = (shopId: string) => {
  const [settings, setSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('order-settings', {
        body: { 
          method: 'GET',
          shop_id: shopId 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data;


      if (result?.success && result?.data) {
        setSettings(result.data);
      } else {
        // Use defaults if no data
        setSettings({
          shop_id: shopId,
          post_order_action: 'redirect',
          redirect_enabled: true,
          thank_you_page_url: '',
          popup_title: 'تم إنشاء طلبك بنجاح!',
          popup_message: 'شكراً لك على طلبك. سنتواصل معك قريباً...'
        });
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      // Use defaults on error
      setSettings({
        shop_id: shopId,
        post_order_action: 'redirect',
        redirect_enabled: true,
        thank_you_page_url: '',
        popup_title: 'تم إنشاء طلبك بنجاح!',
        popup_message: 'شكراً لك على طلبك. سنتواصل معك قريباً...'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<OrderSettings>) => {
    if (!shopId) {
      toast({
        title: "خطأ",
        description: "معرف المتجر مطلوب",
        variant: "destructive"
      });
      return false;
    }

    try {
      setSaving(true);

      const settingsToSave = {
        ...settings,
        ...newSettings,
        shop_id: shopId
      };

      const { data, error } = await supabase.functions.invoke('order-settings', {
        body: { 
          method: 'POST',
          shop_id: shopId,
          settings: settingsToSave 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data;


      if (result?.success && result?.data) {
        setSettings(result.data);
        toast({
          title: "تم الحفظ",
          description: "تم حفظ إعدادات الطلبات بنجاح"
        });
        return true;
      } else {
        toast({
          title: "خطأ في الحفظ",
          description: "فشل في حفظ الإعدادات",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error in saveSettings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<OrderSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  useEffect(() => {
    loadSettings();
  }, [shopId]);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateSettings,
    reloadSettings: loadSettings
  };
};