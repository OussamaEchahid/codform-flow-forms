
import { supabase } from '@/integrations/supabase/client';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Shopify API Proxy Endpoint
 * This endpoint serves as a proxy between the frontend and the Shopify API
 * to avoid CORS issues with direct API calls from the browser.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, only POST requests are accepted' });
  }

  try {
    // Extract the required data from the request body
    const { shop, accessToken, query, variables } = req.body;

    if (!shop || !accessToken || !query) {
      return res.status(400).json({ 
        error: 'Missing required parameters: shop, accessToken, and query are required' 
      });
    }

    // Ensure shop domain is formatted correctly
    const normalizedShopDomain = shop.includes('myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    console.log(`Proxying GraphQL request to Shopify for shop: ${normalizedShopDomain}`);
    
    // Make the actual request to Shopify's GraphQL API
    const shopifyUrl = `https://${normalizedShopDomain}/admin/api/2024-01/graphql.json`;
    
    try {
      const response = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });

      // Parse the Shopify response
      const data = await response.json();
      
      // Return the Shopify response data
      return res.status(response.status).json(data);
    } catch (fetchError) {
      console.error('Error making request to Shopify API:', fetchError);
      return res.status(500).json({ 
        error: 'Failed to communicate with Shopify API',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in Shopify proxy handler:', error);
    return res.status(500).json({ 
      error: 'Server error processing request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
