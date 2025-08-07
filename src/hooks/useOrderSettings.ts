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
      console.log('🔍 Loading order settings for shop:', shopId);
      
      // Try to get settings using raw SQL
      const { data: settingsData, error: settingsError } = await supabase.rpc('get_order_settings', {
        p_shop_id: shopId
      });

      console.log('📋 Settings query result:', { settingsData, settingsError, shopId });

      if (settingsError) {
        console.error('Database error:', settingsError);
        // Still continue with defaults instead of throwing
      }

      if (settingsData && settingsData.length > 0) {
        console.log('✅ Found existing settings:', settingsData[0]);
        setSettings(settingsData[0] as OrderSettings);
      } else {
        console.log('📝 No settings found, using defaults');
        const defaultSettings = {
          shop_id: shopId,
          post_order_action: 'redirect' as const,
          redirect_enabled: true,
          thank_you_page_url: '',
          popup_title: 'تم إنشاء طلبك بنجاح!',
          popup_message: 'شكراً لك على طلبك. سنتواصل معك قريباً...'
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      // Use defaults on error
      const defaultSettings = {
        shop_id: shopId,
        post_order_action: 'redirect' as const,
        redirect_enabled: true,
        thank_you_page_url: '',
        popup_title: 'تم إنشاء طلبك بنجاح!',
        popup_message: 'شكراً لك على طلبك. سنتواصل معك قريباً...'
      };
      setSettings(defaultSettings);
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

      console.log('💾 Saving settings:', settingsToSave);

      // Save using RPC function
      const { data: savedData, error: saveError } = await supabase.rpc('save_order_settings', {
        p_shop_id: shopId,
        p_post_order_action: settingsToSave.post_order_action,
        p_redirect_enabled: settingsToSave.redirect_enabled,
        p_thank_you_page_url: settingsToSave.thank_you_page_url,
        p_popup_title: settingsToSave.popup_title,
        p_popup_message: settingsToSave.popup_message
      });

      if (saveError) {
        console.error('Database save error:', saveError);
        toast({
          title: "خطأ في الحفظ",
          description: `فشل في حفظ الإعدادات: ${saveError.message}`,
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Settings saved successfully:', savedData);
      setSettings(settingsToSave);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الطلبات بنجاح"
      });
      return true;
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