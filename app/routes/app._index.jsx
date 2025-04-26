import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const host = url.searchParams.get("host");
  const session = url.searchParams.get("session");
  const timestamp = url.searchParams.get("timestamp");
  
  console.log("App index loader called with URL:", request.url);
  console.log("Shop:", shop);
  
  // بناء عنوان URL للتوجيه
  let redirectUrl = '/redirect.html';
  const params = [];
  
  if (shop) params.push(`shop=${encodeURIComponent(shop)}`);
  if (hmac) params.push(`hmac=${encodeURIComponent(hmac)}`);
  if (host) params.push(`host=${encodeURIComponent(host)}`);
  if (session) params.push(`session=${encodeURIComponent(session)}`);
  if (timestamp) params.push(`timestamp=${encodeURIComponent(timestamp)}`);
  
  if (params.length > 0) {
    redirectUrl += '?' + params.join('&');
  }
  
  return redirect(redirectUrl);
};

export default function Index() {
  useEffect(() => {
    // الحصول على معلمات URL
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    const hmac = urlParams.get("hmac");
    const host = urlParams.get("host");
    const session = urlParams.get("session");
    const timestamp = urlParams.get("timestamp");
    
    // بناء عنوان URL للتوجيه
    let redirectUrl = '/redirect.html';
    const params = [];
    
    if (shop) params.push(`shop=${encodeURIComponent(shop)}`);
    if (hmac) params.push(`hmac=${encodeURIComponent(hmac)}`);
    if (host) params.push(`host=${encodeURIComponent(host)}`);
    if (session) params.push(`session=${encodeURIComponent(session)}`);
    if (timestamp) params.push(`timestamp=${encodeURIComponent(timestamp)}`);
    
    if (params.length > 0) {
      redirectUrl += '?' + params.join('&');
    }
    
    // التوجيه مباشرة إلى صفحة إعادة التوجيه
    window.location.href = redirectUrl;
  }, []);

  return null;
}
