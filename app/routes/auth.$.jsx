import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const host = url.searchParams.get("host");
  const session = url.searchParams.get("session");
  const timestamp = url.searchParams.get("timestamp");

  console.log("Auth loader called with URL:", request.url);
  console.log("Shop:", shop);
  console.log("HMAC:", hmac);
  console.log("Host:", host);
  console.log("Session:", session);
  console.log("Timestamp:", timestamp);

  // استخدام المصادقة العادية من Shopify
  return await authenticate.admin(request);
};

export default function Auth() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>جاري المصادقة...</h1>
      <p>يرجى الانتظار بينما نقوم بمصادقة حسابك.</p>
    </div>
  );
}
