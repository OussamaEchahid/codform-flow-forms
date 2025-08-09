import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

const TAWK_EMBED_URL = "https://embed.tawk.to/689793806ec67e192b9250a5/1j281gbfe";

const TawkToWidget = () => {
  useEffect(() => {
    // Avoid injecting the script more than once
    if (document.getElementById("tawkto-script")) return;

    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    s1.id = "tawkto-script";
    s1.async = true;
    s1.src = TAWK_EMBED_URL;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    const s0 = document.getElementsByTagName("script")[0];
    s0?.parentNode?.insertBefore(s1, s0);
  }, []);

  return null;
};

export default TawkToWidget;
