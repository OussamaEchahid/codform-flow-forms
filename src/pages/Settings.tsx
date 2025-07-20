import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the first settings section (orders)
    navigate('/settings/orders', { replace: true });
  }, [navigate]);

  return null; // This component just redirects
};

export default Settings;