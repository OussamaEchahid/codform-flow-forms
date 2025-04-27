
import { authenticate, login } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Server Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  
  // Log all parameters for debugging
  console.log("Auth route parameters:", {
    shop,
    hmac: url.searchParams.get("hmac"),
    code: url.searchParams.get("code"),
    timestamp: url.searchParams.get("timestamp"),
    host: url.searchParams.get("host"),
    state: url.searchParams.get("state"),
    allParams: Object.fromEntries(url.searchParams.entries())
  });
  
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

    const code = url.searchParams.get("code");
    const hmac = url.searchParams.get("hmac");
    
    // If we have code and hmac, we're in OAuth callback
    if (code && hmac) {
      console.log("OAuth callback detected with code and hmac");
      // Try to authenticate with Shopify
      try {
        const { session } = await authenticate.admin(request);
        console.log("Authentication successful for shop:", session.shop);
        
        // After successful authentication, redirect user directly to dashboard
        const redirectUrl = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}&session_id=${session.id}`;
        console.log("Redirecting to:", redirectUrl);
        
        return redirect(redirectUrl, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          }
        });
      } catch (authError) {
        console.error("Authentication error:", authError);
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(authError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    } 
    // If we only have shop, start OAuth flow
    else if (shop) {
      try {
        console.log("Starting authentication flow for shop:", shop);
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(loginError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    }
    
    // In case of no shop parameter
    return redirect("/dashboard?auth_error=true&error=no_shop_parameter");
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    // If we have a shop in the URL, it means we're at the beginning of the auth process
    if (shop) {
      try {
        // Start Shopify authentication flow
        console.log("Attempting to login for shop:", shop);
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
        // On login error, provide detailed information
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(loginError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    }
    
    // In case of auth error and no shop, redirect user to the home page
    return redirect("/dashboard?auth_error=true&error=authentication_failed");
  }
};

// This function handles post-authentication operations by Shopify
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/dashboard?auth_error=true");
  }
};
