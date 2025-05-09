
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ShopifySettings {
  displayMode: 'light' | 'dark' | 'system';
  embedPosition: 'product-page' | 'cart-page' | 'checkout';
  useCustomCSS: boolean;
  customCSS: string;
  // إضافة الإعدادات الجديدة المطلوبة
  fallbackModeOnly: boolean;
  debugMode: boolean;
  ignoreMetaobjectErrors: boolean;
}

interface ShopifySettingsContextType {
  settings: ShopifySettings;
  updateSettings: (newSettings: Partial<ShopifySettings>) => void;
  // إضافة دالة resetSettings
  resetSettings: () => void;
}

const defaultSettings: ShopifySettings = {
  displayMode: 'light',
  embedPosition: 'product-page',
  useCustomCSS: false,
  customCSS: '',
  // إضافة القيم الافتراضية للإعدادات الجديدة
  fallbackModeOnly: false,
  debugMode: false,
  ignoreMetaobjectErrors: false,
};

const ShopifySettingsContext = createContext<ShopifySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useShopifySettings = () => useContext(ShopifySettingsContext);

interface ShopifySettingsProviderProps {
  children: ReactNode;
}

export const ShopifySettingsProvider: React.FC<ShopifySettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ShopifySettings>(() => {
    // محاولة استرجاع الإعدادات من التخزين المحلي
    const storedSettings = localStorage.getItem('shopify_settings');
    return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<ShopifySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('shopify_settings', JSON.stringify(updatedSettings));
  };

  // إضافة دالة لإعادة تعيين الإعدادات
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('shopify_settings', JSON.stringify(defaultSettings));
  };

  return (
    <ShopifySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ShopifySettingsContext.Provider>
  );
};

export default ShopifySettingsProvider;
