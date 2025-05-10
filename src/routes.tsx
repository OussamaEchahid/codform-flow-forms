
import { RouteObject } from "react-router-dom";
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import Settings from '@/pages/Settings';
import ShopifyRedirect from '@/pages/ShopifyRedirect';
import Shopify from '@/pages/Shopify';
import ShopifyCallback from '@/pages/api/shopify-callback';
import ShopifyProducts from '@/pages/ShopifyProducts';
import ShopifyProductView from '@/pages/ShopifyProductView';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound'; 
import Dashboard from '@/pages/Dashboard';
import Forms from '@/pages/Forms';
import Orders from '@/pages/Orders';
import FormBuilderPage from '@/pages/FormBuilderPage';
import Auth from '@/pages/Auth';
import LandingPages from '@/pages/LandingPages';
import LandingPageEditor from '@/pages/LandingPageEditor';
import LandingPageView from '@/pages/LandingPageView';

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
    path: '/shopify-callback',
    Component: ShopifyCallback,
  },
  {
    path: '/shopify-products',
    Component: ShopifyProducts, 
  },
  {
    path: '/shopify-view',
    Component: ShopifyProductView,
  },
  // Landing pages routes
  {
    path: '/landing-pages',
    Component: LandingPages,
  },
  {
    path: '/landing-pages/editor',
    Component: LandingPageEditor,
  },
  {
    path: '/landing-pages/editor/:id',
    Component: LandingPageEditor,
  },
  {
    path: '/landing/:slug',
    Component: LandingPageView,
  },
  {
    path: '*',
    Component: NotFound
  }
];
