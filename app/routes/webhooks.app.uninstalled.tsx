import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, session } = await authenticate.webhook(request);

    if (topic === "APP_UNINSTALLED") {
      try {
        console.log(`🗑️ App uninstalled for shop: ${shop}`);
        if (session) {
          await prisma.session.deleteMany({ where: { shop } });
        }
        return new Response("OK", { 
          status: 200,
          headers: { "Content-Type": "text/plain" }
        });
      } catch (e) {
        console.error("Failed to cleanup sessions on uninstall", e);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Unhandled webhook topic", { status: 404 });
  } catch (error) {
    console.error("❌ Webhook HMAC verification failed:", error);
    return new Response("Unauthorized", { 
      status: 401,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
