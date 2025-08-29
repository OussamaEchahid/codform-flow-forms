
import { RouteObject } from "react-router-dom";
import Settings from '@/pages/Settings';
import OrderSettings from '@/pages/OrderSettings';
import GeneralSettings from '@/pages/GeneralSettings';
import SecuritySettings from '@/pages/SecuritySettings';
import BillingCenter from '@/pages/BillingCenter';
import CurrencySettings from '@/pages/CurrencySettings';
import CurrencyManagement from '@/pages/CurrencyManagement';
import QuantityOffers from '@/pages/QuantityOffers';
import AdvertisingTracking from '@/pages/AdvertisingTracking';
import Shopify from '@/pages/Shopify';
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
import ThankYou from '@/pages/ThankYou';
import EnhancedMyStores from '@/pages/EnhancedMyStores';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Support from '@/pages/Support';
import BlockedPage from '@/pages/BlockedPage';
import ShopifyProtectionSetup from '@/pages/ShopifyProtectionSetup';

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/',
    Component: Index
  },
  {
    path: '/dashboard',
    Component: Dashboard
  },
  {
    path: '/forms',
    Component: Forms
  },
  {
    path: '/my-stores',
    Component: EnhancedMyStores
  },
  {
    path: '/shopify-connect',
    Component: Shopify,
  },
  {
    path: '/form-builder',
    Component: FormBuilderPage
  },
  {
    path: '/form-builder/:formId',
    Component: FormBuilderPage
  },
  {
    path: '/orders',
    Component: Orders
  },
  {
    path: '/orders/list',
    Component: OrdersList
  },
  {
    path: '/orders/abandoned',
    Component: AbandonedOrders
  },
  {
    path: '/orders/channels',
    Component: OrdersChannels
  },
  {
    path: '/settings',
    Component: Settings
  },
  {
    path: '/settings/orders',
    Component: OrderSettings
  },
  {
    path: '/settings/general',
    Component: GeneralSettings
  },
  {
    path: '/settings/security',
    Component: SecuritySettings
  },
  {
    path: '/settings/plans',
    Component: BillingCenter
  },
  {
    path: '/settings/currency',
    Component: CurrencySettings
  },
  {
    path: '/currency-management',
    Component: CurrencyManagement
  },
  {
    path: '/quantity-offers',
    Component: QuantityOffers
  },
  {
    path: '/settings/quantity-offers',
    Component: QuantityOffers
  },
  {
    path: '/advertising-tracking',
    Component: AdvertisingTracking
  },
  {
    path: '/shopify-callback',
    Component: ShopifyCallback,
  },
  {
    path: '/thank-you',
    Component: ThankYou,
  },
  {
    path: '/privacy',
    Component: Privacy,
  },
  {
    path: '/terms',
    Component: Terms,
  },
  {
    path: '/support',
    Component: Support,
  },
  {
    path: '/security',
    Component: SecuritySettings,
  },
  {
    path: '/blocked',
    Component: BlockedPage,
  },
  {
    path: '/shopify-protection',
    Component: ShopifyProtectionSetup,
  },
  {
    path: '*',
    Component: NotFound
  }
];
