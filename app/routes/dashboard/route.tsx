import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  
  // Return data needed for the dashboard
  return { shopifyConnected: true };
};

export default function ShopifyDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the original dashboard
    navigate("/dashboard");
  }, [navigate]);
  
  return null;
}
