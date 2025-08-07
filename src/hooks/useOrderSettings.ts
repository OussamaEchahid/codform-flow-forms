import { useState, useEffect } from 'react';
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

  const getStorageKey = (shopId: string) => `order_settings_${shopId}`;

  const loadSettings = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading order settings for shop:', shopId);
      
      // Try to get settings from localStorage first
      const storageKey = getStorageKey(shopId);
      const storedSettings = localStorage.getItem(storageKey);
      
      if (storedSettings) {
        console.log('✅ Found existing settings in localStorage:', storedSettings);
        const parsedSettings = JSON.parse(storedSettings) as OrderSettings;
        setSettings(parsedSettings);
      } else {
        console.log('📝 No settings found, using defaults');
        const defaultSettings: OrderSettings = {
          shop_id: shopId,
          post_order_action: 'redirect',
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
      const defaultSettings: OrderSettings = {
        shop_id: shopId,
        post_order_action: 'redirect',
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
        shop_id: shopId,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving settings:', settingsToSave);

      // Save to localStorage
      const storageKey = getStorageKey(shopId);
      localStorage.setItem(storageKey, JSON.stringify(settingsToSave));

      console.log('✅ Settings saved successfully to localStorage');
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