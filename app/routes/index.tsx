
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  const code = url.searchParams.get("code");
  
  console.log("Root route accessed with params:", { shopifyReferrer, hmac, code, timestamp });
  
  // If we have a shop parameter, first redirect to the shopify page
  if (shopifyReferrer) {
    console.log("Redirecting to /shopify with shop parameter");
    
    // Make sure to include all URL parameters in the redirect
    const params = new URLSearchParams();
    params.set("shop", shopifyReferrer);
    if (hmac) params.set("hmac", hmac);
    if (timestamp) params.set("timestamp", timestamp);
    if (code) params.set("code", code);
    
    return redirect(`/shopify?${params.toString()}`);
  }
  
  // If we have other Shopify auth parameters (hmac, code), redirect to auth route
  if (hmac || code) {
    console.log("Redirecting to auth with authentication parameters");
    const params = new URLSearchParams(url.search);
    return redirect(`/auth?${params.toString()}`);
  }
  
  // For all other cases, redirect to dashboard
  console.log("No Shopify parameters found, redirecting to dashboard");
  return redirect('/dashboard');
}
