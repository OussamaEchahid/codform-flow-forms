import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "7e4608874bbcc38afa1953948da28407",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "18221d830a86da52082e0d06c0d32ba3",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(",") || ["write_products", "read_orders", "write_orders"],
  appUrl: process.env.SHOPIFY_APP_URL || "https://codform-flow-forms.lovable.app",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  isEmbeddedApp: false,
  hooks: {
    afterAuth: async ({ session }) => {
      return {
        status: 302,
        headers: {
          Location: "/dashboard",
        },
      };
    }
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
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
