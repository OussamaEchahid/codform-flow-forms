
import { RouteObject } from "react-router-dom";
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import Settings from '@/pages/Settings';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import Shopify from '@/pages/Shopify';
import ShopifyConnect from '@/pages/ShopifyConnect';
import ShopifyStores from '@/pages/ShopifyStores';
import ShopifyTest from '@/pages/ShopifyTest';
import ShopifyProducts from '@/pages/ShopifyProducts';
import ShopifyProductView from '@/pages/ShopifyProductView';
import ShopifySync from '@/pages/ShopifySync';
import Index from '@/pages/Index';
import ShopifyCallback from '@/pages/api/shopify-callback';
import NotFound from '@/pages/NotFound'; 
import Dashboard from '@/pages/Dashboard';
import Forms from '@/pages/Forms';
import Orders from '@/pages/Orders';
import OrdersList from '@/pages/OrdersList';
import AbandonedOrders from '@/pages/AbandonedOrders';
import OrdersChannels from '@/pages/OrdersChannels';
import FormBuilderPage from '@/pages/FormBuilderPage';
import Auth from '@/pages/Auth';

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/forms',
    Component: Forms,
  },
  {
    path: '/form-builder',
    Component: FormBuilderPage,
  },
  {
    path: '/form-builder/:formId',
    Component: FormBuilderPage,
  },
  {
    path: '/orders',
    Component: Orders,
  },
  {
    path: '/orders/list',
    Component: OrdersList,
  },
  {
    path: '/orders/abandoned',
    Component: AbandonedOrders,
  },
  {
    path: '/orders/channels',
    Component: OrdersChannels,
  },
  {
    path: '/auth/*',
    Component: Auth,
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
    path: '/shopify-connect',
    Component: ShopifyConnect,
  },
  {
    path: '/shopify-stores',
    Component: ShopifyStores,
  },
  {
    path: '/shopify-callback',
    Component: ShopifyCallback,
  },
  {
    path: '/shopify-test',
    Component: ShopifyTest,
  },
  {
    path: '/shopify-products',
    Component: ShopifyProducts, 
  },
  {
    path: '/shopify-view',
    Component: ShopifyProductView,
  },
  {
    path: '/shopify-sync',
    Component: ShopifySync,
  },
  {
    path: '*',
    Component: NotFound
  }
];
