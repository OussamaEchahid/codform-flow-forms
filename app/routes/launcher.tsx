import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React, { useEffect, useMemo } from "react";
import { authenticate } from "../shopify.server";
import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge/utilities";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  // Ensure we are authenticated in Admin (embedded)
  const { session } = await authenticate.admin(request);

  const apiKey = process.env.SHOPIFY_API_KEY || "";
  const externalUrl = process.env.SHOPIFY_APP_URL || "https://codform-flow-forms.lovable.app";

  return json({ apiKey, host, externalUrl, shop: session.shop });
};

export default function Launcher() {
  const { apiKey, host, externalUrl, shop } = useLoaderData<typeof loader>();

  const openUrl = useMemo(() => {
    // سنمرر التوكن عبر query ونوفّر رابط احتياطي
    const base = new URL("/shopify-redirect", externalUrl);
    base.searchParams.set("shop", shop);
    if (host) base.searchParams.set("host", host);
    return base.toString();
  }, [externalUrl, host, shop]);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hostParam = urlParams.get("host") || host;

      // Initialize App Bridge v3
      const app = createApp({ apiKey, host: hostParam || "", forceRedirect: true });

      getSessionToken(app)
        .then((token) => {
          const target = new URL(openUrl);
          target.searchParams.set("session_token", token);
          window.open(target.toString(), "_blank", "noopener,noreferrer");
        })
        .catch(() => {
          // Fallback: افتح بدون توكن
          window.open(openUrl, "_blank", "noopener,noreferrer");
        });
    } catch (e) {
      // Silent fallback
      window.open(openUrl, "_blank", "noopener,noreferrer");
    }
  }, [apiKey, host, openUrl]);

  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <h1>Opening dashboard…</h1>
        <p>If a new tab didn’t open automatically, use the button below.</p>
        <p style={{ marginTop: 16 }}>
          <a href={openUrl} target="_blank" rel="noreferrer">Open dashboard</a>
        </p>
      </div>
    </main>
  );
}
