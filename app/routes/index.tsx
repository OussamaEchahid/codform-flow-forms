
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  let shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  const code = url.searchParams.get("code");
  
  console.log("Root route accessed with params:", { shopifyReferrer, hmac, code, timestamp });
  
  // Clean up shop URL if it contains protocol
  if (shopifyReferrer) {
    try {
      // If it starts with http:// or https://, take only the domain name
      if (shopifyReferrer.startsWith('http')) {
        const shopUrl = new URL(shopifyReferrer);
        shopifyReferrer = shopUrl.hostname;
        console.log("Cleaned shop parameter:", shopifyReferrer);
      }
      
      // Make sure it ends with myshopify.com
      if (!shopifyReferrer.endsWith('myshopify.com')) {
        if (!shopifyReferrer.includes('.')) {
          shopifyReferrer = `${shopifyReferrer}.myshopify.com`;
          console.log("Added myshopify.com to shop:", shopifyReferrer);
        }
      }
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // If we have a shop parameter, first redirect user to auth page
  if (shopifyReferrer) {
    console.log("Redirecting to auth with shop parameter:", shopifyReferrer);
    
    // Make sure to include all URL parameters in the redirect
    const params = new URLSearchParams();
    params.set("shop", shopifyReferrer);
    if (hmac) params.set("hmac", hmac);
    if (timestamp) params.set("timestamp", timestamp);
    if (code) params.set("code", code);
    
    return redirect(`/auth?${params.toString()}`);
  }
  
  // If we have other Shopify auth parameters (hmac, code), redirect to auth path
  if (hmac || code) {
    console.log("Redirecting to auth with authentication parameters");
    const params = new URLSearchParams(url.search);
    return redirect(`/auth?${params.toString()}`);
  }
  
  // For all other cases, redirect to dashboard
  console.log("No Shopify parameters found, redirecting to dashboard");
  return redirect('/dashboard');
}
