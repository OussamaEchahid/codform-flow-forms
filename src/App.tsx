
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import FormsPage from '@/pages/FormsPage';
import FormBuilderPage from '@/pages/FormBuilderPage';
import SubmissionsPage from '@/pages/SubmissionsPage';
import SettingsPage from '@/pages/SettingsPage';
import ShopifyPage from '@/pages/ShopifyPage';
import NotFoundPage from '@/pages/NotFoundPage';
import Layout from '@/components/layout/Layout';
import Auth from '@/pages/Auth';
import ShopifyRedirect from '@/pages/ShopifyRedirect';

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
      
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      
      {/* Protected Routes with Layout */}
      <Route path="/" element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forms" element={<FormsPage />} />
        <Route path="/form-builder/:formId" element={<FormBuilderPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/shopify" element={<ShopifyPage />} />
      </Route>
      
      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
