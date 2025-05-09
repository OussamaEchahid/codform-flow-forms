
import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { ShopifyConnectionProvider } from '@/lib/shopify/ShopifyConnectionProvider';
import { ShopifySettingsProvider } from '@/lib/shopify/ShopifySettingsProvider';
import RootLayout from './layouts/RootLayout';
import Dashboard from './pages/Dashboard';
import Forms from './pages/Forms';
import FormSettings from './pages/FormSettings';
import Submissions from './pages/Submissions';
import Shopify from './pages/Shopify';
import ShopifyConnect from './pages/ShopifyConnect';
import ShopifyCallback from './pages/api/shopify-callback';
import NotFound from './pages/NotFound';
import { shopifyConnectionService } from '@/services/ShopifyConnectionService';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { queryClient } from './lib/query-client';
import ThemeSettings from './pages/ThemeSettings';

function App() {
  useEffect(() => {
    const cleanupTokens = async () => {
      try {
        console.log('App mounted, cleaning tokens and validating connection');
        await shopifyConnectionService.cleanupPlaceholderTokens();
        console.log('Placeholder tokens cleaned up on startup');
        
        const storedShop = localStorage.getItem('shopify_store');
        const connected = localStorage.getItem('shopify_connected') === 'true';
        
        if (storedShop && connected) {
          console.log('Found valid shop connection, reinforcing it:', storedShop);
          shopifyConnectionManager.addOrUpdateStore(storedShop, true);
          await shopifyConnectionService.syncStoreToDatabase(storedShop);
          console.log('Connection validated and reinforced successfully');
        }
      } catch (error) {
        console.error('Error cleaning placeholder tokens on app start:', error);
      }
    };
    
    cleanupTokens();
    queryClient.clear();
  }, []);

  return (
    <BrowserRouter>
      <ShopifySettingsProvider>
        <ShopifyConnectionProvider>
          <SonnerToaster position="top-right" />
          <Toaster />
          <Suspense fallback={<div>جاري التحميل...</div>}>
            <Routes>
              <Route path="/" element={<RootLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="forms" element={<Forms />} />
                <Route path="forms/:formId/settings" element={<FormSettings />} />
                <Route path="forms/:formId/submissions" element={<Submissions />} />
                <Route path="shopify" element={<Shopify />} />
                <Route path="shopify-connect" element={<ShopifyConnect />} />
                <Route path="shopify-callback" element={<ShopifyCallback />} />
                <Route path="theme-settings" element={<ThemeSettings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </ShopifyConnectionProvider>
      </ShopifySettingsProvider>
    </BrowserRouter>
  );
}

export default App;
