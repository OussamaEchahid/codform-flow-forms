
import { RouteObject } from "react-router-dom";
import Settings from '@/pages/Settings';
import OrderSettings from '@/pages/OrderSettings';
import GeneralSettings from '@/pages/GeneralSettings';
import SpamSettings from '@/pages/SpamSettings';
import PlansSettings from '@/pages/PlansSettings';
import QuantityOffers from '@/pages/QuantityOffers';
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
    path: '/settings/spam',
    Component: SpamSettings
  },
  {
    path: '/settings/plans',
    Component: PlansSettings
  },
  {
    path: '/settings/quantity-offers',
    Component: QuantityOffers
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
    path: '*',
    Component: NotFound
  }
];
