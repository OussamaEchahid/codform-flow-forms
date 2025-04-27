import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export async function loader() {
  // If this is being loaded from Shopify, redirect to auth
  const shopifyReferrer = new URL(request.url).searchParams.get("shop");
  if (shopifyReferrer) {
    return redirect(`/auth?shop=${shopifyReferrer}`);
  }
  
  // Otherwise, render the component
  return null;
}

export default function Index() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if this is being loaded from Shopify
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    
    if (shop) {
      // Redirect to auth if coming from Shopify
      window.location.href = `/auth?shop=${shop}`;
    }
  }, [navigate]);
  
  // This will render the original Index component from src/pages/Index.tsx
  // We're just adding the Shopify redirect logic
  
  // Import and render the original Index component
  const OriginalIndex = require("../../src/pages/Index").default;
  return <OriginalIndex />;
}
