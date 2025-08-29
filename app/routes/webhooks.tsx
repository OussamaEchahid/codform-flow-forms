
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
    case "APP_SUBSCRIPTIONS_UPDATE": {
      try {
        const payload = await request.json();
        // payload structure contains app_subscription with status and line items
        const appSub = payload?.app_subscription || payload?.subscription || payload;
        const status = appSub?.status?.toLowerCase?.() || '';
        const lineItems = appSub?.line_items || appSub?.lineItems || [];

        // Infer plan type from pricing amount if you don't store Shopify plan IDs
        // Example maps to your internal plan ids (basic, premium)
        let plan_type: 'free' | 'basic' | 'premium' | null = null;
        const amount = Number(lineItems?.[0]?.plan?.pricing_details?.price?.amount ?? lineItems?.[0]?.plan?.pricingDetails?.price?.amount);
        if (!isNaN(amount)) {
          if (amount >= 22 && amount < 30) plan_type = 'premium';
          else if (amount >= 11 && amount < 20) plan_type = 'basic';
        }

        // Persist to DB if we detected plan, otherwise just ack
        if (shop && plan_type) {
          // لا نعين active إلا إذا كانت من Shopify فعلاً
          const normalized = status === 'active' ? 'active' : (status === 'cancelled' || status === 'declined') ? 'cancelled' : 'pending';
          await prisma.$executeRawUnsafe(
            `insert into shop_subscriptions (shop_domain, plan_type, status, updated_at)
             values ($1, $2, $3, now())
             on conflict (shop_domain) do update set plan_type = excluded.plan_type, status = excluded.status, updated_at = now()`,
            shop,
            plan_type,
            normalized
          );
        }
      } catch (err) {
        console.error('APP_SUBSCRIPTIONS_UPDATE webhook error', err);
      }
      break;
    }
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
