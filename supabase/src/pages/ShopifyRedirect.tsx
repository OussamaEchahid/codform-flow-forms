import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ShopifyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the shop parameter from the URL
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");

    // Determine where to redirect based on the current path
    if (location.pathname.includes("/auth")) {
      // If we're on the auth path, redirect to Shopify auth
      window.location.href = `/auth?shop=${shop}`;
    } else if (location.pathname.includes("/dashboard")) {
      // If we're on the dashboard path, redirect to the dashboard
      navigate("/dashboard");
    } else {
      // For any other Shopify-related path, check if we have a shop parameter
      if (shop) {
        // If we have a shop parameter, redirect to auth
        window.location.href = `/auth?shop=${shop}`;
      } else {
        // Otherwise, redirect to the home page
        navigate("/");
      }
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">جاري التوجيه...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4">سيتم توجيهك تلقائيًا خلال لحظات...</p>
      </div>
    </div>
  );
};

export default ShopifyRedirect;
