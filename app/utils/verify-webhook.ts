import crypto from "crypto";

// Constant time comparison to prevent timing attacks
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Verify Shopify webhook HMAC for Remix routes
export async function verifyWebhookHmac(request: Request) {
  try {
    const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_KEY || "";
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
    if (!secret || !hmacHeader) return { valid: false };

    const rawBody = await request.text();
    const digest = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    const valid = safeEqual(digest, hmacHeader);
    return { valid };
  } catch (e) {
    console.error("verifyWebhookHmac error:", e);
    return { valid: false };
  }
}

export default { verifyWebhookHmac, safeEqual };

