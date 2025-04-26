import { useRouteError } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Link,
} from "@shopify/polaris";

export default function ErrorPage() {
  const error = useRouteError();
  console.error("Error caught in error boundary:", error);

  return (
    <Page>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h1" variant="headingXl">
                    حدث خطأ
                  </Text>
                  <Text as="p" variant="bodyLg">
                    نأسف، حدث خطأ أثناء تحميل الصفحة.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">
                    تفاصيل الخطأ
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {error?.message || "خطأ غير معروف"}
                  </Text>
                  {error?.stack && (
                    <pre style={{ whiteSpace: "pre-wrap", overflow: "auto", maxHeight: "200px" }}>
                      {error.stack}
                    </pre>
                  )}
                </BlockStack>
                
                <Button
                  primary
                  url="/"
                >
                  العودة إلى الصفحة الرئيسية
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
