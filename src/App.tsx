
import { useState } from "react";
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
import NotFound from "@/pages/NotFound";
import ShopifyRedirect from "@/pages/ShopifyRedirect";
import Shopify from "@/pages/Shopify";
import Auth from "@/pages/Auth";
import ShopifyCallback from "@/pages/api/shopify-callback";
import ShopifyStores from "@/pages/ShopifyStores";
import Settings from "@/pages/Settings";

// Components
import { Toaster, toast } from "sonner";
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

// تعزيز المسارات المحمية للتحقق من اتصال Shopify أو مصادقة المستخدم
const ProtectedRoute = ({ requireAuth = true }: { requireAuth?: boolean }) => {
  const { shopifyConnected, user, shop, loading } = useAuth();
  
  // إذا كان لا يزال يتم التحميل، نعرض حالة التحميل
  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }
  
  // فحص متعدد المصادر للتحقق من حالة الاتصال
  const activeStore = shopifyConnectionManager.getActiveStore();
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  
  // استخدام جميع المصادر المتاحة بشكل أكثر تساهلاً لتحديد ما إذا كان المستخدم لديه حق الوصول
  const hasShopifyAccess = shopifyConnected || localStorageConnected || !!activeStore || !!localStorageShop;
  const isAuthenticated = !!user; // التحقق مما إذا كان المستخدم مصادقًا عليه
  
  // إذا كان لدينا أي مصدر يشير إلى اتصال أو سجل لاتصال سابق، نسمح بالوصول
  // هذا يحل مشكلة حلقة إعادة التوجيه
  const hasAccess = isAuthenticated || hasShopifyAccess || (process.env.NODE_ENV === 'development');
  
  console.log("Protected route check:", {
    authContextConnected: shopifyConnected,
    localStorageConnected,
    activeStore,
    localStorageShop,
    hasShopifyAccess,
    isAuthenticated,
    hasAccess,
    requireAuth,
    env: process.env.NODE_ENV
  });
  
  // في بيئة التطوير أو إذا كان لدينا أي نوع من الاتصال، اسمح بالوصول
  if (requireAuth && !hasAccess) {
    console.log("No authentication or Shopify connection, redirecting to /shopify");
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
      
      {/* إضافة طريق callback بشكل واضح */}
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      <Route path="/settings" element={<Settings />} />
      
      {/* المسارات المحمية التي تتطلب مصادقة لكن بشكل أكثر تساهلاً */}
      <Route element={<ProtectedRoute requireAuth={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
      
      {/* المسارات التي لا تتطلب المصادقة بشكل صارم ولكن تستخدم حالة المصادقة إذا كانت متاحة */}
      <Route path="/shopify-stores" element={<ShopifyStores />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // التحقق من حالة الاتصال بـ Shopify عند بدء التشغيل
  shopifyConnectionManager.validateConnectionState();
  
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Router>
            <AuthProvider>
              <AppRoutes />
              <Toaster position="top-center" richColors closeButton />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
