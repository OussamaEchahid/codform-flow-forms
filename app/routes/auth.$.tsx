
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Server Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  
  // Clean up the shop URL if it contains protocol
  if (shop) {
    try {
      // If it starts with http:// or https://, take only the domain name
      if (shop.startsWith('http')) {
        const shopUrl = new URL(shop);
        shop = shopUrl.hostname;
        console.log("Cleaned shop parameter:", shop);
      }
      
      // Make sure the shop ends with myshopify.com
      if (!shop.endsWith('myshopify.com')) {
        console.log("Shop domain does not end with myshopify.com:", shop);
        if (!shop.includes('.')) {
          shop = `${shop}.myshopify.com`;
          console.log("Added myshopify.com to shop:", shop);
        }
      }
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  console.log("Processing auth for shop:", shop);
  
  try {
    // Replace shop parameter in URL with cleaned value
    if (url.searchParams.has("shop") && shop) {
      url.searchParams.set("shop", shop);
      // Create a new request with updated URL
      request = new Request(url.toString(), request);
    }

    // Try to authenticate with Shopify
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // After successful authentication, redirect user directly to dashboard
    // Add crucial state tracking parameters
    const redirectUrl = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}`;
    console.log("Redirecting to:", redirectUrl);
    return redirect(redirectUrl);
  } catch (error) {
    console.log("Authentication error:", error.message);
    
    // If we have a shop in the URL, it means we're at the beginning of the auth process
    if (shop) {
      try {
        // Import login function
        const { login } = await import("../shopify.server");
        
        // Start Shopify authentication flow
        console.log("Starting authentication flow for shop:", shop);
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
        // On login error, provide detailed information
        return redirect(`/?auth_error=true&error=${encodeURIComponent(loginError.message)}&shop=${encodeURIComponent(shop)}`);
      }
    }
    
    // In case of auth error and no shop, redirect user to the home page
    return redirect("/?auth_error=true");
  }
};

// This function handles post-authentication operations by Shopify
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/?auth_error=true");
  }
};
