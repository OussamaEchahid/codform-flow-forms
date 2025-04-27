
import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  
  if (shopifyReferrer) {
    console.log("Redirecting to auth with shop:", shopifyReferrer);
    return redirect(`/auth?shop=${shopifyReferrer}`);
  }
  
  return redirect('/dashboard');
}

export default function Index() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    
    if (shop) {
      window.location.href = `/auth?shop=${shop}`;
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  return null;
}

