import { authenticate } from "../shopify.server";
import { ActionFunctionArgs } from "@remix-run/node";

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
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  return new Response();
};
