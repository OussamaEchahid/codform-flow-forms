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
import Forms from "@/pages/Forms"; // نستورد صفحة النماذج الجديدة
import Orders from "@/pages/Orders";
import NotFound from "@/pages/NotFound";
import ShopifyRedirect from "@/pages/ShopifyRedirect";
import Shopify from "@/pages/Shopify";
import Auth from "@/pages/Auth";
import ShopifyCallback from "@/pages/api/shopify-callback";
import ShopifyStores from "@/pages/ShopifyStores";

// Components
import { Toaster } from "sonner";

const queryClient = new QueryClient();

// Protected route that checks for Shopify connection
const ProtectedRoute = ({ requireAuth = true }: { requireAuth?: boolean }) => {
  const { shopifyConnected, shop } = useAuth();
  
  if (requireAuth && !shopifyConnected) {
    return <Navigate to="/shopify" replace />;
  }
  
  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/shopify" element={<Shopify />} />
      <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="/shopify-callback" element={<ShopifyCallback />} />
      
      {/* Protected routes that require Shopify authentication */}
      <Route element={<ProtectedRoute requireAuth={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
      
      {/* Routes that don't strictly require auth but use auth state if available */}
      <Route path="/shopify-stores" element={<ShopifyStores />} />
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
              <AppRoutes />
              <Toaster position="top-center" />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
