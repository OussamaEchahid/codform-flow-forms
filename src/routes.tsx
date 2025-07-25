
import { RouteObject } from "react-router-dom";
import ProtectedRoute from '@/components/ProtectedRoute';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import Settings from '@/pages/Settings';
import OrderSettings from '@/pages/OrderSettings';
import GeneralSettings from '@/pages/GeneralSettings';
import SpamSettings from '@/pages/SpamSettings';
import PlansSettings from '@/pages/PlansSettings';
import QuantityOffers from '@/pages/QuantityOffers';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import Shopify from '@/pages/Shopify';

import ShopifyStores from '@/pages/ShopifyStores';
import ShopifyTest from '@/pages/ShopifyTest';
import ShopifyProducts from '@/pages/ShopifyProducts';
import ShopifyProductView from '@/pages/ShopifyProductView';
import ShopifySync from '@/pages/ShopifySync';
import Index from '@/pages/Index';
import ShopifyCallback from '@/pages/ShopifyCallback';
import NotFound from '@/pages/NotFound'; 
import Dashboard from '@/pages/Dashboard';
import Forms from '@/pages/Forms';
import Orders from '@/pages/Orders';
import OrdersList from '@/pages/OrdersList';
import AbandonedOrders from '@/pages/AbandonedOrders';
import OrdersChannels from '@/pages/OrdersChannels';
import FormBuilderPage from '@/pages/FormBuilderPage';
import Auth from '@/pages/Auth';
import Login from '@/pages/Login';
import ShopifyAccountLink from '@/pages/ShopifyAccountLink';
import ThankYou from '@/pages/ThankYou';
import LandingPages from '@/pages/LandingPages';
import MyStores from '@/pages/MyStores';

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forms',
    element: (
      <ProtectedRoute>
        <Forms />
      </ProtectedRoute>
    ),
  },
  {
    path: '/landing-pages',
    Component: LandingPages,
  },
  {
    path: '/my-stores',
    Component: MyStores,
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
    path: '/login',
    Component: Login,
  },
  {
    path: '/shopify-account-link',
    Component: ShopifyAccountLink,
  },
  {
    path: '/settings',
    Component: Settings,
  },
  {
    path: '/settings/orders',
    Component: OrderSettings,
  },
  {
    path: '/settings/general',
    Component: GeneralSettings,
  },
  {
    path: '/settings/spam',
    Component: SpamSettings,
  },
  {
    path: '/settings/plans',
    Component: PlansSettings,
  },
  {
    path: '/settings/quantity-offers',
    Component: QuantityOffers,
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
    Component: Shopify,
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
    path: '/shopify-view',
    Component: ShopifyProductView,
  },
  {
    path: '/shopify-sync',
    Component: ShopifySync,
  },
  {
    path: '/thank-you',
    Component: ThankYou,
  },
  {
    path: '*',
    Component: NotFound
  }
];
