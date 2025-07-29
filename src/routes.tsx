
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
import ShopifyAutoAccountCreator from '@/components/shopify/ShopifyAutoAccountCreator';
import Profile from '@/pages/Profile';
import ThankYou from '@/pages/ThankYou';
import LandingPages from '@/pages/LandingPages';
import MyStores from '@/pages/MyStores';
import EnhancedMyStores from '@/pages/EnhancedMyStores';

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/forms',
    element: (
      <ProtectedRoute requireAuth={true}>
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
    element: (
      <ProtectedRoute requireAuth={true}>
        <EnhancedMyStores />
      </ProtectedRoute>
    ),
  },
  {
    path: '/auth',
    Component: Auth,
  },
  {
    path: '/form-builder',
    element: (
      <ProtectedRoute requireAuth={true}>
        <FormBuilderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/form-builder/:formId',
    element: (
      <ProtectedRoute requireAuth={true}>
        <FormBuilderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Orders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders/list',
    element: (
      <ProtectedRoute requireAuth={true}>
        <OrdersList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders/abandoned',
    element: (
      <ProtectedRoute requireAuth={true}>
        <AbandonedOrders />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders/channels',
    element: (
      <ProtectedRoute requireAuth={true}>
        <OrdersChannels />
      </ProtectedRoute>
    ),
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
    path: '/shopify-auto-connect',
    Component: ShopifyAutoAccountCreator,
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/orders',
    element: (
      <ProtectedRoute requireAuth={true}>
        <OrderSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/general',
    element: (
      <ProtectedRoute requireAuth={true}>
        <GeneralSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/spam',
    element: (
      <ProtectedRoute requireAuth={true}>
        <SpamSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/plans',
    element: (
      <ProtectedRoute requireAuth={true}>
        <PlansSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/quantity-offers',
    element: (
      <ProtectedRoute requireAuth={true}>
        <QuantityOffers />
      </ProtectedRoute>
    ),
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
    element: (
      <ProtectedRoute requireAuth={true}>
        <ShopifyStores />
      </ProtectedRoute>
    ),
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
