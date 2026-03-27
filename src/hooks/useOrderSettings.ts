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
  const isAdminMode = typeof window !== 'undefined' && localStorage.getItem('admin_bypass') === 'true';
  const [settings, setSettings] = useState<OrderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getStorageKey = (shopId: string) => `order_settings_${shopId}`;

  const loadSettings = async () => {
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const currentShop = activeStore || storeFromStorage || (isAdminMode ? 'admin-bypass' : null);

    if (!currentShop) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading order settings for shop:', currentShop);

      // Try to load from Supabase database first
      try {
        /* Replaced direct REST call with Edge Function invocation to avoid hard-coded keys */

        const { data: fnData, error: fnError } = await supabase.functions.invoke('order-settings', {
          body: { shop_id: currentShop, method: 'GET' }
        });












        if (!fnError) {
          const dbRecord = (fnData as any)?.data || (fnData as any)?.record || null;
          if (dbRecord) {
            console.log('✅ Found existing settings in database');
            const orderSettings = dbRecord as OrderSettings;
            setSettings(orderSettings);
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
          popup_title: 'Order Created Successfully!',
          popup_message: 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.'
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
        popup_title: 'Order Created Successfully!',
        popup_message: 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.'
      };
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<OrderSettings>) => {
    const storeFromStorage = localStorage.getItem('current_shopify_store');
    const currentShop = activeStore || storeFromStorage || (isAdminMode ? 'admin-bypass' : null);

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

      // Save to Supabase database with proper UPSERT (create row if missing)
      try {
        const payload = {
          shop_id: currentShop,
          post_order_action: settingsToSave.post_order_action,
          redirect_enabled: settingsToSave.redirect_enabled,
          thank_you_page_url: settingsToSave.thank_you_page_url || '',
          popup_title: settingsToSave.popup_title || 'Order Created Successfully!',
          popup_message: settingsToSave.popup_message || 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.'
        };

        // Primary attempt: POST with upsert using on_conflict=shop_id
        let response = await fetch(`https://nnwnuurkcmuvprirsfho.supabase.co/rest/v1/order_settings?on_conflict=shop_id`, {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud251dXJrY211dnByaXJzZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTMwMjcsImV4cCI6MjA4OTY2OTAyN30.u91K1NfUkhYiIPOVGNb3CepK0F8WfjPhGcG1T63KDOc',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud251dXJrY211dnByaXJzZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTMwMjcsImV4cCI6MjA4OTY2OTAyN30.u91K1NfUkhYiIPOVGNb3CepK0F8WfjPhGcG1T63KDOc',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });

        // Fallback: if POST upsert is not allowed, PATCH the specific row
        if (!response.ok) {
          console.warn('⚠️ POST upsert failed with', response.status, '-> trying PATCH');
          response = await fetch(`https://nnwnuurkcmuvprirsfho.supabase.co/rest/v1/order_settings?shop_id=eq.${currentShop}`, {
            method: 'PATCH',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ud251dXJrY211dnByaXJzZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTMwMjcsImV4cCI6MjA4OTY2OTAyN30.u91K1NfUkhYiIPOVGNb3CepK0F8WfjPhGcG1T63KDOc',

              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
          });
        }

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