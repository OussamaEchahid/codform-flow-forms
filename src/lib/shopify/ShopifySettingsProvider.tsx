
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ShopifySettings {
  displayMode: 'light' | 'dark' | 'system';
  embedPosition: 'product-page' | 'cart-page' | 'checkout';
  useCustomCSS: boolean;
  customCSS: string;
}

interface ShopifySettingsContextType {
  settings: ShopifySettings;
  updateSettings: (newSettings: Partial<ShopifySettings>) => void;
}

const defaultSettings: ShopifySettings = {
  displayMode: 'light',
  embedPosition: 'product-page',
  useCustomCSS: false,
  customCSS: '',
};

const ShopifySettingsContext = createContext<ShopifySettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const useShopifySettings = () => useContext(ShopifySettingsContext);

interface ShopifySettingsProviderProps {
  children: ReactNode;
}

export const ShopifySettingsProvider: React.FC<ShopifySettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ShopifySettings>(() => {
    // Try to get settings from localStorage
    const storedSettings = localStorage.getItem('shopify_settings');
    return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<ShopifySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('shopify_settings', JSON.stringify(updatedSettings));
  };

  return (
    <ShopifySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ShopifySettingsContext.Provider>
  );
};

export default ShopifySettingsProvider;
