import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);
    
    // Log successful webhook verification
    console.log(`✅ GDPR webhook verified: ${topic} for shop: ${shop}`);
    
    return new Response("OK", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    console.error("❌ Webhook HMAC verification failed:", error);
    return new Response("Unauthorized", { 
      status: 401,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
