import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";

export const loader = async () => {
  return json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
    },
  });
};

export default function App() {
  const { env } = useLoaderData();
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        {env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                console.log('Development mode active');
                window.onerror = function(message, source, lineno, colno, error) {
                  console.error('Global error caught:', { message, source, lineno, colno, error });
                  return false;
                };
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}

// إضافة معالج الخطأ
export function ErrorBoundary() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
        <title>خطأ</title>
      </head>
      <body>
        <AppProvider>
          <div style={{ padding: "20px" }}>
            <h1>حدث خطأ غير متوقع</h1>
            <p>نأسف، حدث خطأ أثناء تحميل التطبيق.</p>
            <p>
              <a href="/" style={{ color: "#008060", textDecoration: "underline" }}>
                العودة إلى الصفحة الرئيسية
              </a>
            </p>
          </div>
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
