import { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  if (topic === "APP_UNINSTALLED") {
    try {
      if (session) {
        await prisma.session.deleteMany({ where: { shop } });
      }
    } catch (e) {
      console.error("Failed to cleanup sessions on uninstall", e);
    }
    return new Response();
  }

  return new Response("Unhandled webhook topic", { status: 404 });
};
