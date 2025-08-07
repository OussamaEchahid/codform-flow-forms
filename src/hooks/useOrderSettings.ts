import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useShopifyStores } from '@/hooks/useShopifyStores';

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

export const useOrderSettings = () => {
  const { activeStore } = useShopifyStores();
  const [settings, setSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getStorageKey = (shopId: string) => `order_settings_${shopId}`;

  const loadSettings = async () => {
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const currentShop = activeStore || storeFromStorage;
    
    if (!currentShop) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading order settings for shop:', currentShop);
      
      // Get settings from localStorage - same pattern as other working sections
      const storageKey = getStorageKey(currentShop);
      const storedSettings = localStorage.getItem(storageKey);
      
      if (storedSettings) {
        console.log('✅ Found existing settings in localStorage');
        const parsedSettings = JSON.parse(storedSettings) as OrderSettings;
        setSettings(parsedSettings);
      } else {
        console.log('📝 No settings found, using defaults');
        const defaultSettings: OrderSettings = {
          shop_id: currentShop,
          post_order_action: 'redirect',
          redirect_enabled: true,
          thank_you_page_url: '',
          popup_title: 'تم إنشاء طلبك بنجاح!',
          popup_message: 'شكراً لك على طلبك. سنتواصل معك قريباً...'
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      // Use defaults on error - same as other working sections
      const defaultSettings: OrderSettings = {
        shop_id: currentShop,
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
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const currentShop = activeStore || storeFromStorage;
    
    if (!currentShop) {
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
        shop_id: currentShop,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving settings:', settingsToSave);

      // Save to localStorage - same pattern as other working sections
      const storageKey = getStorageKey(currentShop);
      localStorage.setItem(storageKey, JSON.stringify(settingsToSave));

      console.log('✅ Settings saved successfully');
      setSettings(settingsToSave);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الطلبات بنجاح"
      });
      return true;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
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
  }, [activeStore]);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateSettings,
    reloadSettings: loadSettings
  };
};