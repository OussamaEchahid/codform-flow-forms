import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/layout/AuthProvider";
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
import ShopifyConnect from "@/pages/ShopifyConnect";
import Auth from "@/pages/Auth";
import ShopifyCallback from "@/pages/ShopifyCallback";
import ShopifyStores from "@/pages/ShopifyStores";
import Settings from "@/pages/Settings";
import OrderSettings from "@/pages/OrderSettings";
import GeneralSettings from "@/pages/GeneralSettings";
import SpamSettings from "@/pages/SpamSettings";
import PlansSettings from "@/pages/PlansSettings";
import QuantityOffers from "@/pages/QuantityOffers";
import LandingPages from "@/pages/LandingPages";
import MyStores from "@/pages/MyStores";

// Components
import { Toaster } from "@/components/ui/toaster"; 
import { toast } from "sonner"; 
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";
import { fixShopifyConnectionState } from "@/utils/fix-shopify-state";
import ShopifyAutoConnector from "@/components/shopify/ShopifyAutoConnector";

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
  
  // Enhanced connection checking to be more tolerant of different connection states
  const activeStore = shopifyConnectionManager.getActiveStore();
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
  
  // Check for ANY indication of a connection - much more tolerant approach
  const hasShopifyAccess = shopifyConnected || localStorageConnected || !!activeStore || !!localStorageShop;
  const isAuthenticated = !!user; // التحقق مما إذا كان المستخدم مصادقًا عليه
  
  // Allow access if ANY indication of connection exists
  // Including a bypass flag for better reliability
  const hasAccess = isAuthenticated || hasShopifyAccess || (process.env.NODE_ENV === 'development') || bypassAuth;
  
  console.log("Protected route check:", {
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
  
  // Only redirect if we have absolutely no indication of access rights
  if (requireAuth && !hasAccess) {
    console.log("No authentication or Shopify connection, redirecting to /shopify-connect");
    
    // Save current path for redirection after authentication
    const currentPath = window.location.pathname;
    if (currentPath !== '/shopify-connect') {
      localStorage.setItem('auth_redirect', currentPath);
    }
    
    toast.info("يجب الاتصال بمتجر Shopify أولاً");
    return <Navigate to="/shopify-connect" replace />;
  }
  
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
      <Route path="/shopify-connect" element={<ShopifyConnect />} />
      <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
      <Route path="/auth/*" element={<Auth />} />
      
      {/* إضافة طريق callback بشكل واضح */}
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      <Route path="/settings" element={<Settings />} />
              <Route path="/settings/orders" element={<OrderSettings />} />
              <Route path="/settings/general" element={<GeneralSettings />} />
              <Route path="/settings/spam" element={<SpamSettings />} />
              <Route path="/settings/plans" element={<PlansSettings />} />
              <Route path="/quantity-offers" element={<QuantityOffers />} />
      
      {/* المسارات المحمية التي تتطلب مصادقة لكن بشكل أكثر تساهلاً */}
      <Route element={<ProtectedRoute requireAuth={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/list" element={<OrdersList />} />
        <Route path="/orders/abandoned" element={<AbandonedOrders />} />
        <Route path="/orders/channels" element={<OrdersChannels />} />
        <Route path="/landing-pages" element={<LandingPages />} />
        <Route path="/my-stores" element={<MyStores />} />
      </Route>
      
      {/* المسارات التي لا تتطلب المصادقة بشكل صارم ولكن تستخدم حالة المصادقة إذا كانت متاحة */}
      <Route path="/shopify-stores" element={<ShopifyStores />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // Clean placeholder tokens and validate connection on startup
  React.useEffect(() => {
    console.log("App mounted, cleaning tokens and validating connection");
    
    // تحقق من وجود أخطاء STORE_NOT_FOUND وأصلحها
    const detectAndFixConnectionIssues = () => {
      const activeStore = shopifyConnectionManager.getActiveStore();
      const urlParams = new URLSearchParams(window.location.search);
      const urlShop = urlParams.get('shop');
      
      console.log('Current connection state:', {
        activeStore,
        urlShop,
        localStorage: {
          shopify_store: localStorage.getItem('shopify_store'),
          shopify_connected: localStorage.getItem('shopify_connected')
        }
      });
      
      // إذا كان هناك متجر مختلف في URL، استخدمه
      if (urlShop && urlShop !== activeStore) {
        console.log(`URL shop (${urlShop}) differs from active store (${activeStore}), updating...`);
        shopifyConnectionManager.clearAllStores();
        shopifyConnectionManager.addOrUpdateStore(urlShop, true, true);
        window.location.reload();
        return;
      }
      
      // إذا كان لا يوجد متجر نشط، امسح كل شيء وأعد التوجيه
      if (!activeStore) {
        console.log('No active store found, clearing state and redirecting to connect');
        fixShopifyConnectionState();
        return;
      }
    };
    
    // Attempt to validate the connection state with retry logic
    const validateConnection = async () => {
      try {
        detectAndFixConnectionIssues();
        
        // Validate connection without excessive cleanup
        shopifyConnectionManager.validateConnectionState();
        console.log("Connection validated successfully");
      } catch (error) {
        console.error("Error validating connection:", error);
        
        // If validation fails, clear everything and retry
        console.log("Validation failed, attempting fix...");
        fixShopifyConnectionState();
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
              <ShopifyAutoConnector />
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
