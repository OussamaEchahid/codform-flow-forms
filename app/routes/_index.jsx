import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const host = url.searchParams.get("host");
  const session = url.searchParams.get("session");
  const timestamp = url.searchParams.get("timestamp");

  console.log("Index loader called with URL:", request.url);
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const hmac = searchParams.get("hmac");
  const host = searchParams.get("host");
  const session = searchParams.get("session");
  const timestamp = searchParams.get("timestamp");

  useEffect(() => {
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
    
    navigate(redirectUrl);
  }, [shop, hmac, host, session, timestamp, navigate]);

  return null;
}
