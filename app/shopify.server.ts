
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

console.log("Initializing Shopify app with environment:", {
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || 'Using fallback API key',
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL || 'Using fallback APP URL',
  Scopes: process.env.SCOPES ? 'Using ENV scopes' : 'Using fallback scopes',
  isEmbedded: process.env.EMBEDDED === "true"
});

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "7e4608874bbcc38afa1953948da28407",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "18221d830a86da52082e0d06c0d32ba3",
  apiVersion: ApiVersion.January25,
  // قمنا بتحديث نطاقات الصلاحيات بناءً على قائمة المشكلات المحتملة
  scopes: process.env.SCOPES?.split(",") || ["write_products", "read_products", "read_orders", "write_orders", "read_themes", "read_content", "write_content"],
  appUrl: process.env.SHOPIFY_APP_URL || "https://codform-flow-forms.lovable.app",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  // هذا الإعداد مهم جداً - التطبيق غير مضمن
  isEmbeddedApp: false,
  // إضافة المزيد من النطاقات المسموح بها
  hooks: {
    afterAuth: async ({ session, admin }) => {
      console.log("Authentication completed successfully for shop:", session.shop);
      
      // تأكد من وجود الجلسة
      if (!session || !session.shop) {
        console.error("Missing session or shop in afterAuth hook");
        return {
          status: 302,
          headers: {
            Location: `/dashboard?auth_error=true&error=session_missing`,
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        };
      }
      
      // التحقق من صلاحيات المتجر بعد المصادقة الناجحة
      try {
        console.log("Verifying shop access:", session.shop);
        // سجل معلومات إضافية عن الجلسة
        console.log("Session details:", {
          id: session.id,
          shop: session.shop,
          scope: session.scope,
          expires: session.expires,
          isOnline: session.isOnline,
          accessToken: session.accessToken ? "Present (hidden)" : "Missing",
        });

        // إضافة المزيد من معلومات التصحيح للتوجيه
        const redirectUrl = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}&session_id=${session.id}&new_connection=true`;
        console.log("Redirecting to:", redirectUrl);
        
        return {
          status: 302,
          headers: {
            Location: redirectUrl,
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Auth-Result": "success",
          },
        };
      } catch (error) {
        console.error("Error verifying shop access:", error);
        return {
          status: 302,
          headers: {
            Location: `/dashboard?auth_error=true&error=${encodeURIComponent("Error verifying shop access")}`,
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        };
      }
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

console.log("Shopify app initialized with options:", {
  appUrl: process.env.SHOPIFY_APP_URL || "https://codform-flow-forms.lovable.app",
  authPathPrefix: "/auth",
  apiVersion: ApiVersion.January25,
  distribution: "app_store",
  isEmbeddedApp: true,
  validRedirectUrls: [
    "https://codform-flow-forms.lovable.app/shopify-callback",
    "https://codform-flow-forms.lovable.app/api/shopify-callback",
    "https://codform-flow-forms.lovable.app/auth/callback",
    "https://codform-flow-forms.lovable.app/auth/offline",
    "https://codform-flow-forms.lovable.app/auth/token",
    "https://codform-flow-forms.lovable.app/auth",
    "https://codform-flow-forms.lovable.app/shopify",
    "https://codform-flow-forms.lovable.app/shopify-redirect",
    "https://codform-flow-forms.lovable.app/dashboard",
    "https://codform-flow-forms.lovable.app"
  ]
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
