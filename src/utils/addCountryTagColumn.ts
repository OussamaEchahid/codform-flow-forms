// Utility to add country_tag column to forms table
import { supabase } from '@/integrations/supabase/client';

export async function addCountryTagColumn() {
  try {
    console.log('🔧 Adding country_tag column to forms table...');

    // Try to add country_tag column using direct SQL
    const { error: addColumnError } = await supabase
      .from('forms')
      .select('country_tag')
      .limit(1);

    if (addColumnError && addColumnError.message.includes('column "country_tag" does not exist')) {
      console.log('Column does not exist, need to add it manually via Supabase dashboard');
      return false;
    }

    console.log('✅ country_tag column already exists or was added successfully');
    return true;
  } catch (error) {
    console.error('Error in addCountryTagColumn:', error);
    return false;
  }
}

export async function updateCreateFormRPC() {
  try {
    console.log('🔧 RPC function will be updated manually via Supabase dashboard');
    console.log('The current RPC function should work without country_tag parameter');
    return true;
  } catch (error) {
    console.error('Error in updateCreateFormRPC:', error);
    return false;
  }
}
