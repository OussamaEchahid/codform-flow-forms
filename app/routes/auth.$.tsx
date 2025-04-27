
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // بعد المصادقة، قم بالتوجيه إلى لوحة التحكم
  return redirect("/dashboard");
};
