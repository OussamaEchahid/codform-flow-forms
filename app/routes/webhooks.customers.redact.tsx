import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { verifyWebhookHmac } from "../utils/verify-webhook";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Hard fail fast: manual HMAC verification to satisfy automated checks
  const { valid } = await verifyWebhookHmac(request.clone());
  if (!valid) {
    return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "text/plain" } });
  }

  try {
    const { topic, shop } = await authenticate.webhook(request);

    // Log successful webhook verification
    console.log(`✅ GDPR webhook verified: ${topic} for shop: ${shop}`);

    // Best-effort: actual anonymization handled by background systems
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
