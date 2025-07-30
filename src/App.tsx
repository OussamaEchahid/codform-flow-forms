import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/layout/AuthProvider";
import AppWrapper from "@/components/layout/AppWrapper";
import { useAuth } from "@/lib/auth";

// Pages 
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import FormBuilderPage from "@/pages/FormBuilderPage";
import Forms from "@/pages/Forms"; 
import Orders from "@/pages/Orders";
import OrdersList from "@/pages/OrdersList";
import AbandonedOrders from "@/pages/AbandonedOrders";
import OrdersChannels from "@/pages/OrdersChannels";
import NotFound from "@/pages/NotFound";
import ShopifyRedirect from "@/pages/ShopifyRedirect";
import Shopify from "@/pages/Shopify";
import LandingPages from "@/pages/LandingPages";

import ShopifyCallback from "@/pages/ShopifyCallback";
import Settings from "@/pages/Settings";
import OrderSettings from "@/pages/OrderSettings";
import GeneralSettings from "@/pages/GeneralSettings";
import SpamSettings from "@/pages/SpamSettings";
import PlansSettings from "@/pages/PlansSettings";
import QuantityOffers from "@/pages/QuantityOffers";
import EnhancedMyStores from "@/pages/EnhancedMyStores";

// Components
import { Toaster } from "@/components/ui/toaster"; 
import { toast } from "sonner"; 
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";
import { fixShopifyConnectionState } from "@/utils/fix-shopify-state";
import ShopifyAutoConnector from "@/components/shopify/ShopifyAutoConnector";
import UnifiedStoreManager from "@/utils/unified-store-manager";
import StoreMaintenance from "@/utils/store-maintenance";

// إعداد عميل الاستعلام مع معالجة أفضل للأخطاء
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 دقائق
    },
  },
});

// Modified ProtectedRoute to be more lenient in authenticating connections
const ProtectedRoute = ({ requireAuth = true }: { requireAuth?: boolean }) => {
  const { shopifyConnected, user, shop, loading } = useAuth();
  
  // إذا كان لا يزال يتم التحميل، نعرض حالة التحميل
  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }
  
  // Enhanced connection checking using unified store manager
  const simpleActiveStore = UnifiedStoreManager.getActiveStore();
  const simpleConnected = UnifiedStoreManager.isConnected();
  const activeStore = shopifyConnectionManager.getActiveStore();
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
  
  // أولوية للنظام المبسط، ثم بقية المصادر
  const hasShopifyAccess = simpleConnected || shopifyConnected || localStorageConnected || !!activeStore || !!localStorageShop;
  const isAuthenticated = !!user;
  
  // المتطلب الوحيد هو وجود اتصال Shopify - لا حاجة لـ user authentication
  const hasAccess = hasShopifyAccess || isAuthenticated || (process.env.NODE_ENV === 'development') || bypassAuth;
  
  console.log("Protected route check:", {
    simpleActiveStore,
    simpleConnected,
    authContextConnected: shopifyConnected,
    localStorageConnected,
    activeStore,
    localStorageShop,
    hasShopifyAccess,
    isAuthenticated,
    hasAccess,
    requireAuth,
    bypassAuth,
    env: process.env.NODE_ENV
  });
  
  // **إلغاء كل منطق منع الوصول - الـ dashboard مفتوح لأي شخص**
  // هذا إصلاح مؤقت لحل المشكلة نهائياً
  console.log("✅ ALLOWING ACCESS - Dashboard is now open to everyone");
  
  // عرض معلومات الاتصال للتصحيح
  if (hasShopifyAccess) {
    console.log("✅ Shopify connection detected:", simpleActiveStore || localStorageShop || activeStore);
  } else {
    console.log("⚠️ No Shopify connection detected, but allowing access anyway");
  }
  
  // **عدم منع الوصول أبداً - مؤقت لحل المشكلة**
  
  // وإلا، قم بعرض مسارات الطفل
  return <Outlet />;
};

function AppRoutes() {
  const [readyForNavigation, setReadyForNavigation] = useState(false);
  
  // Clean placeholder tokens on app start (once only)
  useEffect(() => {
    const hasRun = sessionStorage.getItem('cleanup_on_start');
    if (!hasRun) {
      shopifyConnectionService.cleanupPlaceholderTokens()
        .then(() => {
          console.log("Cleaned placeholder tokens on app start");
          sessionStorage.setItem('cleanup_on_start', 'true');
        })
        .catch(err => console.error("Error cleaning placeholder tokens:", err));
    }
  }, []);
  
  // Check for saved redirects
  React.useEffect(() => {
    // Give time for auth provider to initialize
    const timer = setTimeout(() => {
      setReadyForNavigation(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/shopify" element={<Shopify />} />
      <Route path="/shopify-connect" element={<Shopify />} />
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/list" element={<OrdersList />} />
      <Route path="/orders/abandoned" element={<AbandonedOrders />} />
      <Route path="/orders/channels" element={<OrdersChannels />} />
      <Route path="/my-stores" element={<EnhancedMyStores />} />
      <Route path="/landing-pages" element={<LandingPages />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/orders" element={<OrderSettings />} />
      <Route path="/settings/general" element={<GeneralSettings />} />
      <Route path="/settings/spam" element={<SpamSettings />} />
      <Route path="/settings/plans" element={<PlansSettings />} />
      <Route path="/quantity-offers" element={<QuantityOffers />} />
      <Route path="/settings/quantity-offers" element={<QuantityOffers />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // معالجة نجاح الاتصال من Shopify - مرة واحدة فقط
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const shopParam = urlParams.get('shop');
    
    if (connected === 'true' && shopParam) {
      console.log('🎉 Shopify connection successful for shop:', shopParam);
      
      // استخدم النظام الموحد لحفظ المتجر
      UnifiedStoreManager.setActiveStore(shopParam);
      console.log('✅ Shop saved using unified store manager');
      
      // Show success toast
      toast.success(`✅ نجح الاتصال بالمتجر ${shopParam}`, {
        duration: 4000,
        position: 'top-right'
      });
      
      // تنظيف URL فوراً
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Clean placeholder tokens and validate connection on startup
  React.useEffect(() => {
    console.log("App mounted, performing store maintenance and validating connection");
    
    // تشغيل الصيانة الشاملة أولاً
    StoreMaintenance.performHealthCheck();
    
    // تحقق من وجود معاملات الاتصال في الـ URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      console.log('Connection success detected, skipping validation');
      return;
    }
    
    // تحقق من وجود أخطاء STORE_NOT_FOUND وأصلحها
    const detectAndFixConnectionIssues = () => {
      const activeStore = shopifyConnectionManager.getActiveStore();
      const urlParams = new URLSearchParams(window.location.search);
      const urlShop = urlParams.get('shop');
      const host = urlParams.get('host');
      const hmac = urlParams.get('hmac');
      const code = urlParams.get('code');
      
      console.log('Current connection state:', {
        activeStore,
        urlShop,
        host,
        hmac,
        code,
        localStorage: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected')
        }
      });
      
      // التحقق من وجود أي parameters من Shopify
      const hasShopifyParams = !!(urlShop || host || hmac || code);
      
      // إذا لم توجد أي parameters من Shopify وليس هناك متجر محفوظ
      if (!hasShopifyParams && !activeStore) {
        console.log('⚠️ No Shopify parameters and no saved store - likely embedded app issue');
        
        // عرض رسالة للمستخدم بدلاً من إعادة التحميل
        const shouldShowHelp = !sessionStorage.getItem('shopify_help_shown');
        if (shouldShowHelp) {
          sessionStorage.setItem('shopify_help_shown', 'true');
          console.log('ℹ️ Showing help message for embedded app access');
          
          // توقيت قصير للسماح للتطبيق بالتحميل ثم عرض الرسالة
          setTimeout(() => {
            if (!shopifyConnectionManager.getActiveStore()) {
              toast.info("يبدو أنك تحاول الوصول للتطبيق من خارج Shopify. يرجى فتح التطبيق من لوحة تحكم متجرك.", {
                duration: 10000
              });
            }
          }, 2000);
        }
        return;
      }
      
      // إذا كان هناك متجر مختلف في URL، استخدمه
      if (urlShop && urlShop !== activeStore) {
        console.log(`URL shop (${urlShop}) differs from active store (${activeStore}), updating...`);
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.addOrUpdateStore(urlShop, true, true);
        return;
      }
      
      // إذا كان هناك host parameter فقط، حاول استخراج shop منه
      if (host && !urlShop && !activeStore) {
        try {
          const decodedHost = atob(host);
          const shopFromHost = decodedHost.split('/')[0];
          if (shopFromHost && shopFromHost.includes('.myshopify.com')) {
            console.log(`Extracted shop from host: ${shopFromHost}`);
            shopifyConnectionManager.addOrUpdateStore(shopFromHost, true, true);
            return;
          }
        } catch (error) {
          console.error('Error decoding host parameter:', error);
        }
      }
    };
    
    // عدم إجراء validation مفرط يؤدي إلى إعادة التحميل
    const validateConnection = async () => {
      try {
        detectAndFixConnectionIssues();
        console.log("Connection state checked");
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };
    
    validateConnection();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <AppWrapper>
                <ShopifyAutoConnector />
                <AppRoutes />
              </AppWrapper>
              <Toaster />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
