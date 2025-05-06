
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/router';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // We need to use the main supabase client, not the Shopify-specific one
      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: req.body.form_id,
          data: req.body.data
        });

      if (error) {
        throw error;
      }

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error saving form submission:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to save form submission' 
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
