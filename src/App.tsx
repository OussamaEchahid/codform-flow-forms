
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/layout/AuthProvider";

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

// Components
import { Toaster } from "sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/form-builder/:formId?" element={<FormBuilderPage />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/shopify" element={<Shopify />} />
              <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/api/shopify-callback" element={<ShopifyCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-center" />
          </AuthProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
