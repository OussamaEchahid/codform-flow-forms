
import { RouteObject } from "react-router-dom";
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import Settings from '@/pages/Settings';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import Shopify from '@/pages/Shopify';
import ShopifyStores from '@/pages/ShopifyStores';
import ShopifyTest from '@/pages/ShopifyTest';
import Index from '@/pages/Index';
import ShopifyCallback from '@/pages/api/shopify-callback';

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index
  },
  {
    path: '/dashboard',
    Component: FormBuilderDashboard,
  },
  {
    path: '/form-builder/:formId',
    Component: FormBuilderDashboard,
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
  {
    path: '/shopify-callback',
    Component: ShopifyCallback,
  },
  {
    path: '/shopify-test',
    Component: ShopifyTest,
  }
];
