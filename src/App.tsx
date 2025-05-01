
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Forms from '@/pages/Forms';
import Settings from '@/pages/Settings';
import Shopify from '@/pages/Shopify';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import ShopifyCallback from '@/api/shopify-callback';
import Logout from '@/pages/Logout';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Forms />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/shopify" element={<Shopify />} />
        <Route path="/shopify-redirect" element={<ShopifyRedirect />} />
        <Route path="/api/shopify-callback" element={<ShopifyCallback />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </>
  );
}

export default App;
