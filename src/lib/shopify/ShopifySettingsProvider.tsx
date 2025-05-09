
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ShopifySettings {
  fallbackModeOnly: boolean;
  debugMode: boolean;
  ignoreMetaobjectErrors: boolean; // إضافة خيار جديد لتجاهل أخطاء metaobject
}

interface ShopifySettingsContextType {
  settings: ShopifySettings;
  updateSettings: (newSettings: Partial<ShopifySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ShopifySettings = {
  fallbackModeOnly: false,
  debugMode: false,
  ignoreMetaobjectErrors: false, // الإعداد الافتراضي هو عدم التجاهل
};

const ShopifySettingsContext = createContext<ShopifySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useShopifySettings = () => useContext(ShopifySettingsContext);

export const ShopifySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedSettings, setStoredSettings] = useLocalStorage<ShopifySettings>(
    'shopify_settings',
    defaultSettings
  );
  
  const [settings, setSettings] = useState<ShopifySettings>(storedSettings);
  
  // تحديث الإعدادات المحلية عند تغيير الإعدادات المخزنة
  useEffect(() => {
    setSettings(storedSettings);
  }, [storedSettings]);
  
  // تحديث الإعدادات
  const updateSettings = (newSettings: Partial<ShopifySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setStoredSettings(updatedSettings);
    
    console.log('Shopify settings updated:', updatedSettings);
  };
  
  // إعادة تعيين الإعدادات إلى القيم الافتراضية
  const resetSettings = () => {
    setSettings(defaultSettings);
    setStoredSettings(defaultSettings);
    console.log('Shopify settings reset to defaults');
  };
  
  return (
    <ShopifySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ShopifySettingsContext.Provider>
  );
};
