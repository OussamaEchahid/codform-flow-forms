
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { useAuth } from "@/lib/auth";
import { ShopifyConnectionProvider } from '@/lib/shopify/ShopifyConnectionProvider';

// Pages 
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import FormBuilderPage from "@/pages/FormBuilderPage";
import Forms from "@/pages/Forms"; 
import Orders from "@/pages/Orders";
import NotFound from "@/pages/NotFound";
import ShopifyRedirect from "@/pages/ShopifyRedirect";
import Shopify from "@/pages/Shopify";
import ShopifyConnect from "@/pages/ShopifyConnect";
import Auth from "@/pages/Auth";
import ShopifyCallback from "@/pages/api/shopify-callback";
import ShopifyStores from "@/pages/ShopifyStores";
import ShopifyTest from "@/pages/ShopifyTest";
import ShopifyProducts from "@/pages/ShopifyProducts";
import Settings from "@/pages/Settings";

// Landing Pages
import LandingPages from "@/pages/LandingPages";
import LandingPageEditor from "@/pages/LandingPageEditor";
import LandingPageView from "@/pages/LandingPageView";

// Components
import { Toaster } from "@/components/ui/toaster"; 
import { toast, Toaster as SonnerToaster } from "sonner"; 
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService"; 

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
  const [connectionOverride, setConnectionOverride] = useState<boolean | null>(null);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // Force reliable connection state on initial load
  useEffect(() => {
    if (!loading && !connectionAttempted) {
      setConnectionAttempted(true);
      
      // Check all possible storage locations
      const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
      const localStorageShop = localStorage.getItem('shopify_store');
      const sessionShop = sessionStorage.getItem('shopify_store');
      const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
      const activeStore = shopifyConnectionManager.getActiveStore();
      
      // Enforce consistent connection state across storage locations
      if ((localStorageConnected && localStorageShop) || bypassAuth || activeStore) {
        // We have evidence of a connection, set override
        setConnectionOverride(true);
        
        // Ensure all storage locations are synchronized
        const shopToUse = localStorageShop || activeStore || sessionShop;
        if (shopToUse) {
          localStorage.setItem('shopify_store', shopToUse);
          localStorage.setItem('shopify_connected', 'true');
          shopifyConnectionManager.setActiveStore(shopToUse);
        }
      }
    }
  }, [loading, connectionAttempted]);
  
  // إذا كان لا يزال يتم التحميل، نعرض حالة التحميل
  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }
  
  // Use override if available
  const effectiveConnected = connectionOverride !== null ? connectionOverride : shopifyConnected;
  
  // Check for ANY indication of a connection - much more tolerant approach
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
  const activeStore = shopifyConnectionManager.getActiveStore();
  
  // Allow access if ANY indication of connection exists
  const hasShopifyAccess = effectiveConnected || localStorageConnected || !!activeStore || !!localStorageShop || bypassAuth;
  const isAuthenticated = !!user; // التحقق مما إذا كان المستخدم مصادقًا عليه
  
  // Allow access based on any valid connection evidence or in development
  const hasAccess = isAuthenticated || hasShopifyAccess || (process.env.NODE_ENV === 'development');
  
  console.log("Protected route check:", {
    authContextConnected: shopifyConnected,
    effectiveConnected,
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
  
  // Clean placeholder tokens on app start
  useEffect(() => {
    shopifyConnectionService.cleanupPlaceholderTokens()
      .then(() => console.log("Cleaned placeholder tokens on app start"))
      .catch(err => console.error("Error cleaning placeholder tokens:", err));
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
      
      {/* Public landing page routes */}
      <Route path="/landing/:slug" element={<LandingPageView />} />
      
      {/* إضافة طريق callback بشكل واضح */}
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* Add direct routes for ShopifyTest and ShopifyProducts */}
      <Route path="/shopify-test" element={<ShopifyTest />} />
      <Route path="/shopify-products" element={<ShopifyProducts />} />
      
      {/* المسارات المحمية التي تتطلب مصادقة لكن بشكل أكثر تساهلاً */}
      <Route element={<ProtectedRoute requireAuth={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/landing-pages" element={<LandingPages />} />
        <Route path="/landing-pages/editor" element={<LandingPageEditor />} />
        <Route path="/landing-pages/editor/:id" element={<LandingPageEditor />} />
      </Route>
      
      {/* المسارات التي لا تتطلب المصادقة بشكل صارم ولكن تستخدم حالة المصادقة إذا كانت متاحة */}
      <Route path="/shopify-stores" element={<ShopifyStores />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // Add extra reliability to ensure connection state is consistent across the app
  React.useEffect(() => {
    console.log("App mounted, cleaning tokens and validating connection");
    
    // Strengthen connection management on startup
    const validateAndEnsureConnection = async () => {
      try {
        // First clean any placeholder tokens
        await shopifyConnectionService.cleanupPlaceholderTokens();
        console.log("Placeholder tokens cleaned up on startup");
        
        // Then attempt to retrieve connection info from all sources
        const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
        const localStorageShop = localStorage.getItem('shopify_store');
        const activeStore = shopifyConnectionManager.getActiveStore();
        
        // If we have any indication of a connection
        if ((localStorageConnected && localStorageShop) || activeStore) {
          const shop = localStorageShop || activeStore;
          
          // Ensure all storage locations are synchronized
          if (shop) {
            console.log("Found valid shop connection, reinforcing it:", shop);
            
            // Set in all storage locations
            localStorage.setItem('shopify_store', shop);
            localStorage.setItem('shopify_connected', 'true');
            
            // Add bypass flag for extra reliability
            localStorage.setItem('bypass_auth', 'true');
            
            // Set in connection manager
            shopifyConnectionManager.addOrUpdateStore(shop, true, true);
            shopifyConnectionManager.validateConnectionState();
            
            console.log("Connection validated and reinforced successfully");
          }
        } else {
          shopifyConnectionManager.validateConnectionState();
          console.log("No existing connection found, basic validation completed");
        }
      } catch (error) {
        console.error("Error in startup connection validation:", error);
        
        // If validation fails, retry after a delay
        setTimeout(() => {
          try {
            console.log("Retrying connection validation...");
            shopifyConnectionManager.validateConnectionState();
          } catch (retryError) {
            console.error("Retry validation failed:", retryError);
          }
        }, 2000);
      }
    };
    
    validateAndEnsureConnection();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <ShopifyConnectionProvider>
                <SonnerToaster position="top-right" />
                <AppRoutes />
              </ShopifyConnectionProvider>
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
