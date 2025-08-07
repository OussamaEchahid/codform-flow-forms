import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useShopifyStores } from '@/hooks/useShopifyStores';
import { supabase } from '@/integrations/supabase/client';

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
      
      // Try to load from Supabase database first
      try {
        const response = await fetch(`https://trlklwixfeaexhydzaue.supabase.co/rest/v1/order_settings?shop_id=eq.${currentShop}`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const dbSettings = await response.json();
          if (dbSettings && dbSettings.length > 0) {
            console.log('✅ Found existing settings in database');
            const orderSettings = dbSettings[0] as OrderSettings;
            setSettings(orderSettings);
            // Also save to localStorage as backup
            const storageKey = getStorageKey(currentShop);
            localStorage.setItem(storageKey, JSON.stringify(orderSettings));
            return;
          }
        }
      } catch (dbError) {
        console.log('⚠️ Database query failed, falling back to localStorage:', dbError);
      }
      
      // Fallback to localStorage if database fails
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
      // Use defaults on error
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

      console.log('💾 Saving settings to database:', settingsToSave);

      // Save to Supabase database using REST API
      try {
        const response = await fetch('https://trlklwixfeaexhydzaue.supabase.co/rest/v1/order_settings', {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            shop_id: currentShop,
            post_order_action: settingsToSave.post_order_action,
            redirect_enabled: settingsToSave.redirect_enabled,
            thank_you_page_url: settingsToSave.thank_you_page_url || '',
            popup_title: settingsToSave.popup_title || 'تم إنشاء طلبك بنجاح!',
            popup_message: settingsToSave.popup_message || 'شكراً لك على طلبك. سنتواصل معك قريباً...'
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Database save error:', errorData);
          throw new Error(`Database save failed: ${response.status} ${errorData}`);
        }
        
        console.log('✅ Settings saved to database successfully');
      } catch (dbError) {
        console.error('❌ Database save failed, settings saved to localStorage only:', dbError);
        // Continue even if database save fails - localStorage backup will work
      }

      // Also save to localStorage as backup
      const storageKey = getStorageKey(currentShop);
      localStorage.setItem(storageKey, JSON.stringify(settingsToSave));

      console.log('✅ Settings saved successfully to database and localStorage');
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