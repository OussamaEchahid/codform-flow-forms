import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: false, // تعيين إلى false للتطبيق الخارجي
  future: {
    unstable_newEmbeddedAuthStrategy: false, // تعيين إلى false للتطبيق الخارجي
    removeRest: true,
  },
  hooks: {
    afterAuth: async ({ session, request }) => {
      console.log("After auth hook called for shop:", session.shop);
      
      // بعد المصادقة، قم بالتوجيه إلى صفحة إعادة التوجيه
      const redirectUrl = "/redirect.html";
      const shop = session.shop;
      
      // إضافة معلمة المتجر إلى عنوان URL
      const redirectUrlWithShop = `${redirectUrl}?shop=${shop}`;
      
      console.log("Redirecting to:", redirectUrlWithShop);
      
      return {
        redirectUrl: redirectUrlWithShop,
      };
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
