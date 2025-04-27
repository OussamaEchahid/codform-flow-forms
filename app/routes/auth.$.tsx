
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  try {
    // Try to authenticate with Shopify
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // After successful authentication, redirect user directly to dashboard
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}`);
  } catch (error) {
    console.log("Authentication error:", error.message);
    
    // If we have a shop in the URL, it means we're at the beginning of the auth process
    if (shop) {
      try {
        // Start the Shopify auth flow
        console.log("Starting authentication flow for shop:", shop);
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
      }
    }
    
    // In case of auth error and no shop, redirect user to the home page
    return redirect("/?auth_error=true");
  }
};

// Import the login function
import { login } from "../shopify.server";

// This function handles post-auth processes by Shopify
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/?auth_error=true");
  }
};
