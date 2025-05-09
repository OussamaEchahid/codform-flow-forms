
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { useAuth } from "@/lib/auth";
import { ShopifyConnectionProvider } from '@/lib/shopify/ShopifyConnectionProvider';
import { toast, Toaster as SonnerToaster } from "sonner";

// Pages 
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import FormBuilderPage from "@/pages/FormBuilderPage";
import Forms from "@/pages/Forms"; 
import Orders from "@/pages/Orders";
import NotFound from "@/pages/NotFound";
import ShopifyRedirect from "@/pages/ShopifyRedirect";
import Shopify from "@/pages/Shopify";
import Auth from "@/pages/Auth";
import ShopifyCallback from "@/pages/api/shopify-callback";
import ShopifyProducts from "@/pages/ShopifyProducts";
import Settings from "@/pages/Settings";

// Landing Pages
import LandingPages from "@/pages/LandingPages";
import LandingPageEditor from "@/pages/LandingPageEditor";
import LandingPageView from "@/pages/LandingPageView";
import { shopifyConnectionManager } from "@/lib/shopify/connection-manager";

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

// Modified ProtectedRoute to use the ShopifyConnectionProvider
const ProtectedRoute = ({ requireAuth = true }: { requireAuth?: boolean }) => {
  const { user, loading } = useAuth();
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  
  // إذا كان لا يزال يتم التحميل، نعرض حالة التحميل
  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }
  
  // Use context values directly from the ShopifyConnectionProvider
  // This will be injected by the ShopifyConnectionProvider component
  
  // Check for ANY indication of a connection - much more tolerant approach
  const bypassAuth = localStorage.getItem('bypass_auth') === 'true';
  const activeStore = shopifyConnectionManager.getActiveStore();
  
  const isAuthenticated = !!user; // التحقق مما إذا كان المستخدم مصادقًا عليه
  
  // Allow access based on any valid connection evidence or in development
  const hasAccess = isAuthenticated || !!activeStore || bypassAuth || (process.env.NODE_ENV === 'development');
  
  // Only redirect if we have absolutely no indication of access rights
  if (requireAuth && !hasAccess) {
    console.log("No authentication or Shopify connection, redirecting to /shopify");
    
    // Save current path for redirection after authentication
    const currentPath = window.location.pathname;
    if (currentPath !== '/shopify') {
      localStorage.setItem('auth_redirect', currentPath);
    }
    
    toast.info("يجب الاتصال بمتجر Shopify أولاً");
    return <Navigate to="/shopify" replace />;
  }
  
  // وإلا، قم بعرض مسارات الطفل
  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/shopify" element={<Shopify />} />
      <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
      <Route path="/auth/*" element={<Auth />} />
      
      {/* Public landing page routes */}
      <Route path="/landing/:slug" element={<LandingPageView />} />
      
      {/* Shopify callback route */}
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      
      {/* المسارات المحمية التي تتطلب مصادقة */}
      <Route element={<ProtectedRoute requireAuth={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/landing-pages" element={<LandingPages />} />
        <Route path="/landing-pages/editor" element={<LandingPageEditor />} />
        <Route path="/landing-pages/editor/:id" element={<LandingPageEditor />} />
        <Route path="/shopify-products" element={<ShopifyProducts />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
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
