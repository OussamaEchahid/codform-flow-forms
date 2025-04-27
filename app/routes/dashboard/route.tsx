
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopifyConnected = url.searchParams.get("shopify_connected");
  const shop = url.searchParams.get("shop");
  const authSuccess = url.searchParams.get("auth_success");
  
  console.log("Dashboard route accessed with params:", { shopifyConnected, shop, authSuccess });
  
  try {
    // Try to authenticate with Shopify
    const { admin, session } = await authenticate.admin(request);
    
    console.log("Successfully authenticated with Shopify for shop:", session.shop);
    
    // If authentication is successful, return store information
    return json({ 
      shopifyConnected: true,
      shop: session.shop,
      sessionFound: true
    });
  } catch (error) {
    console.log("Not authenticated with Shopify, checking if coming from auth flow");
    
    // If we're coming from auth path with successful shop parameters
    if (shopifyConnected === "true" && shop) {
      console.log("Coming from successful auth flow with shop:", shop);
      return json({ 
        shopifyConnected: true,
        shop: shop,
        fromAuthFlow: true
      });
    }
    
    // Even if there's no Shopify session, allow access to dashboard
    // This allows user to see dashboard without login
    console.log("Allowing access to dashboard without Shopify session");
    return json({ 
      shopifyConnected: false,
      noSession: true
    }, { status: 200 });
  }
};
