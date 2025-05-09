
import { ShopifySettings } from "./ShopifySettingsProvider";
import { supabase } from "@/integrations/supabase/client";

// Import Form from database types instead of @/types
import { Database } from "@/integrations/supabase/database.types";
type Form = Database["public"]["Tables"]["forms"]["Row"];

export const logShopifySettings = (settings: ShopifySettings, prefix: string = '') => {
  console.group(`${prefix || 'Shopify'} Settings:`);
  console.log('Auto Connect:', settings.autoConnect);
  console.log('Use Offline Auth:', settings.useOfflineAuth);
  console.log('Use Local Tokens Only:', settings.useLocalTokensOnly);
  console.log('Skip Token Validation:', settings.skipTokenValidation);
  console.log('Force AppBridge Auth:', settings.forceAppBridgeAuth);
  console.log('Should Redirect:', settings.shouldRedirect);
  console.log('Fallback Mode Only:', settings.fallbackModeOnly);
  console.log('Debug Mode:', settings.debugMode);
  console.log('Ignore Metaobject Errors:', settings.ignoreMetaobjectErrors);
  console.groupEnd();
};

export const getShopifyDebugInfo = (settings: ShopifySettings) => {
  return {
    autoConnect: settings.autoConnect,
    useOfflineAuth: settings.useOfflineAuth,
    useLocalTokensOnly: settings.useLocalTokensOnly,
    skipTokenValidation: settings.skipTokenValidation,
    forceAppBridgeAuth: settings.forceAppBridgeAuth,
    shouldRedirect: settings.shouldRedirect,
    fallbackModeOnly: settings.fallbackModeOnly,
    debugMode: settings.debugMode,
    ignoreMetaobjectErrors: settings.ignoreMetaobjectErrors,
  };
};

export const ensureFormIsPublished = async (formId: string, shopId: string) => {
  try {
    const { data, error } = await supabase
      .from('forms')
      .update({ is_published: true, shop_id: shopId })
      .eq('id', formId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing form:', error);
      return false;
    }

    console.log('Form published successfully:', data);
    return true;
  } catch (error) {
    console.error('Error publishing form:', error);
    return false;
  }
};

export const getFormMetaobjectDefinition = async (form: Form, shop: string, accessToken: string) => {
  try {
    const query = `
      query {
        metaobjectDefinitions(first: 1, namespace: "codform", name: "form_${form.id}") {
          edges {
            node {
              id
              name
              namespace
              fieldDefinitions {
                name
                type
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error('Failed to get metaobject definition:', response.status, response.statusText);
      return null;
    }

    const { data } = await response.json();
    const definition = data?.metaobjectDefinitions?.edges?.[0]?.node;

    return definition;
  } catch (error) {
    console.error('Error getting metaobject definition:', error);
    return null;
  }
};
