
import { authenticate } from "../shopify.server";
import { ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
      }
      break;
    case "APP_SUBSCRIPTIONS_UPDATE":
      break;
    // GDPR compliance topics (sent to /webhooks via compliance_topics)
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      // Verified by authenticate.webhook; just acknowledge
      break;
    default:
      // Unknown topic
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response();
};
