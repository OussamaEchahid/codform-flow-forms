
// This is an edge function to check and update the database schema if needed

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// إعداد عناوين CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// دالة للتحقق من وجود عمود في جدول
async function columnExists(supabase: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_column_exists', {
      p_table_name: tableName,
      p_column_name: columnName
    });

    if (error) {
      // إذا كان هناك خطأ، نحاول استخدام طريقة بديلة
      console.log(`Error checking column ${columnName} in ${tableName}:`, error);
      
      // محاولة الاستعلام من خلال الجدول information_schema.columns
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableName)
        .eq('column_name', columnName);
      
      if (schemaError) {
        console.log('Schema query error:', schemaError);
        return false;
      }
      
      return schemaData && schemaData.length > 0;
    }
    
    return data;
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error);
    return false;
  }
}

// دالة لإضافة عمود token_type إلى جدول shopify_stores
async function addTokenTypeColumn(supabase: any): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Adding token_type column to shopify_stores table');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE shopify_stores ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'offline'"
    });
    
    if (error) {
      console.error('Error adding token_type column:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'token_type column added successfully' };
  } catch (error) {
    console.error('Error in addTokenTypeColumn:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// دالة لإنشاء وظيفة التحقق من وجود العمود
async function createCheckColumnFunction(supabase: any): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Creating check_column_exists function');
    
    const sql = `
    CREATE OR REPLACE FUNCTION check_column_exists(p_table_name TEXT, p_column_name TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
        column_exists BOOLEAN;
    BEGIN
        SELECT COUNT(*) > 0 INTO column_exists
        FROM information_schema.columns
        WHERE table_name = p_table_name
        AND column_name = p_column_name;
        
        RETURN column_exists;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`;
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating check_column_exists function:', error);
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'check_column_exists function created successfully' };
  } catch (error) {
    console.error('Error in createCheckColumnFunction:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// دالة لإنشاء وظيفة تنفيذ SQL
async function createExecSqlFunction(supabase: any): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Creating exec_sql function');
    
    // نستخدم العميل مباشرة للتنفيذ
    const { error } = await supabase.rpc('create_exec_sql_function');
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      
      // إذا كانت الوظيفة موجودة بالفعل، سنعتبر هذا نجاحًا
      if (error.message.includes('already exists')) {
        return { success: true, message: 'exec_sql function already exists' };
      }
      
      // محاولة إنشاء الوظيفة مباشرة
      console.log('Trying to create function directly');
      
      const directSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
      RETURNS VOID AS $$
      BEGIN
          EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;`;
      
      const { error: directError } = await supabase.from('_sql').rpc('query', { query: directSql });
      
      if (directError) {
        console.error('Direct creation error:', directError);
        return { success: false, message: directError.message };
      }
      
      return { success: true, message: 'exec_sql function created directly successfully' };
    }
    
    return { success: true, message: 'exec_sql function created successfully' };
  } catch (error) {
    console.error('Error in createExecSqlFunction:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// دالة لتنفيذ كل التحديثات اللازمة
async function performSchemaUpdates(): Promise<{ success: boolean; details: any[] }> {
  try {
    console.log('Performing schema updates');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const results = [];
    
    // إنشاء الوظائف المساعدة إذا لم تكن موجودة
    // results.push(await createExecSqlFunction(supabase));
    // results.push(await createCheckColumnFunction(supabase));

    // التحقق من وجود عمود token_type وإضافته إذا كان غير موجود
    const hasTokenType = false; // We know token_type doesn't exist in the errors
    
    console.log(`Does token_type column exist? ${hasTokenType ? 'Yes' : 'No'}`);
    
    if (!hasTokenType) {
      // إضافة عمود token_type
      // Use a direct SQL query since our function might not exist yet
      const { error } = await supabase
        .from('_sql')
        .rpc('query', { 
          query: "ALTER TABLE shopify_stores ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'offline'" 
        });
      
      if (error) {
        console.error('Error adding token_type column directly:', error);
        results.push({ 
          operation: 'add_token_type_column_direct', 
          success: false, 
          message: error.message 
        });
        
        // Try another approach using raw JSON RPC
        try {
          const rawResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ 
              sql: "ALTER TABLE shopify_stores ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'offline'" 
            })
          });
          
          if (!rawResponse.ok) {
            const errorData = await rawResponse.json();
            console.error('Raw query error:', errorData);
            results.push({ 
              operation: 'add_token_type_column_raw', 
              success: false, 
              message: `HTTP error ${rawResponse.status}: ${JSON.stringify(errorData)}` 
            });
          } else {
            const responseData = await rawResponse.json();
            results.push({ 
              operation: 'add_token_type_column_raw', 
              success: true, 
              message: 'token_type column added via raw query', 
              data: responseData 
            });
          }
        } catch (rawError) {
          console.error('Raw query exception:', rawError);
          results.push({ 
            operation: 'add_token_type_column_raw', 
            success: false, 
            message: rawError instanceof Error ? rawError.message : 'Unknown error' 
          });
        }
      } else {
        results.push({ 
          operation: 'add_token_type_column_direct', 
          success: true, 
          message: 'token_type column added successfully' 
        });
      }
    } else {
      results.push({ 
        operation: 'check_token_type_column', 
        success: true, 
        message: 'token_type column already exists' 
      });
    }
    
    // Calculate overall success
    const overallSuccess = results.every(r => r.success);
    
    return { success: overallSuccess, details: results };
  } catch (error) {
    console.error('Error in performSchemaUpdates:', error);
    return { 
      success: false, 
      details: [{ 
        operation: 'schema_updates', 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }] 
    };
  }
}

serve(async (req) => {
  // معالجة طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    console.log('Starting schema update process');
    
    // تنفيذ التحديثات اللازمة
    const updateResult = await performSchemaUpdates();
    
    return new Response(
      JSON.stringify({
        success: updateResult.success,
        message: updateResult.success ? 'Schema updated successfully' : 'Schema update had issues',
        details: updateResult.details,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('Error in schema update function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // Using 200 to allow client to process the error
        headers: corsHeaders 
      }
    );
  }
});
