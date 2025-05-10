
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// تحديث واجهة الإعدادات لتتضمن الخصائص المفقودة
export interface ShopifySettings {
  autoConnect: boolean;
  useOfflineAuth: boolean;
  useLocalTokensOnly: boolean;
  skipTokenValidation: boolean;
  forceAppBridgeAuth: boolean;
  shouldRedirect: boolean;
  fallbackModeOnly: boolean;  // خاصية مضافة
  debugMode: boolean;  // خاصية مضافة
  ignoreMetaobjectErrors: boolean;  // خاصية مضافة
}

// تحديث نوع السياق لتضمين وظيفة resetSettings
export interface ShopifySettingsContextType {
  settings: ShopifySettings;
  updateSettings: (newSettings: Partial<ShopifySettings>) => void;
  resetSettings: () => void;  // وظيفة مضافة
}

const defaultSettings: ShopifySettings = {
  autoConnect: true,
  useOfflineAuth: true,
  useLocalTokensOnly: false,
  skipTokenValidation: false,
  forceAppBridgeAuth: false,
  shouldRedirect: true,
  fallbackModeOnly: false,  // قيمة افتراضية للخاصية المضافة
  debugMode: false,  // قيمة افتراضية للخاصية المضافة
  ignoreMetaobjectErrors: false,  // قيمة افتراضية للخاصية المضافة
};

export const ShopifySettingsContext = createContext<ShopifySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},  // تنفيذ افتراضي فارغ
});

export const useShopifySettings = () => useContext(ShopifySettingsContext);

interface ShopifySettingsProviderProps {
  children: ReactNode;
}

export const ShopifySettingsProvider: React.FC<ShopifySettingsProviderProps> = ({ children }) => {
  const [storedSettings, setStoredSettings] = useLocalStorage<ShopifySettings>(
    'shopify_settings',
    defaultSettings
  );

  const [settings, setSettings] = useState<ShopifySettings>(storedSettings || defaultSettings);

  // تحديث الإعدادات المحلية عندما تتغير الإعدادات المخزنة
  useEffect(() => {
    if (storedSettings) {
      setSettings(currentSettings => ({
        ...currentSettings,
        ...storedSettings
      }));
    }
  }, [storedSettings]);

  // تحديث الإعدادات
  const updateSettings = (newSettings: Partial<ShopifySettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
    };
    setSettings(updatedSettings);
    setStoredSettings(updatedSettings);
  };

  // إضافة وظيفة إعادة تعيين الإعدادات
  const resetSettings = () => {
    setSettings(defaultSettings);
    setStoredSettings(defaultSettings);
  };

  return (
    <ShopifySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </ShopifySettingsContext.Provider>
  );
};

export default ShopifySettingsProvider;
