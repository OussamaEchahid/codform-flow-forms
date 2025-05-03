import { RouteObject } from "react-router-dom";
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilder from '@/components/form/builder/FormBuilder';
import Settings from '@/pages/Settings';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import Shopify from '@/pages/Shopify';
import ShopifyStores from '@/pages/ShopifyStores';
import Index from '@/pages/Index';

// إضافة مسار إدارة متاجر Shopify
export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index,
    loader: Index.loader
  },
  {
    path: '/dashboard',
    Component: FormBuilderDashboard,
  },
  {
    path: '/form-builder/:formId',
    Component: FormBuilder,
  },
  {
    path: '/settings',
    Component: Settings,
  },
  {
    path: '/shopify-redirect',
    Component: ShopifyRedirect,
  },
  {
    path: '/shopify',
    Component: Shopify,
  },
  {
    path: '/shopify-stores',
    element: <ShopifyStores />
  },
];
