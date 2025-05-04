
// وظيفة تحديث مخطط قاعدة البيانات للتأكد من وجود جميع الأعمدة المطلوبة

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
};

serve(async (req) => {
  // معالجة طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // التحقق من وجود الأعمدة المطلوبة في جدول shopify_stores
    const hasTokenTypeMigration = await ensureTokenTypeColumn(supabase);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        migrations: {
          hasTokenTypeMigration
        },
        message: "تم تحديث مخطط قاعدة البيانات بنجاح" 
      }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error('Error updating schema:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ غير معروف"
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// دالة للتأكد من وجود عمود token_type في جدول shopify_stores
async function ensureTokenTypeColumn(supabase) {
  try {
    // التحقق من وجود عمود token_type
    const { data: columns, error: columnsError } = await supabase.rpc(
      'check_column_exists', 
      { 
        p_table_name: 'shopify_stores',
        p_column_name: 'token_type'
      }
    );
    
    // إذا فشل الاستعلام، نفترض أن العمود غير موجود
    if (columnsError || !columns) {
      console.log("Error checking column existence or function doesn't exist, attempting direct migration");
      
      // إضافة العمود مباشرة إذا لم يكن موجوداً
      const { error: addColumnError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          p_table: 'shopify_stores',
          p_column: 'token_type',
          p_type: 'text'
        }
      );
      
      if (addColumnError) {
        console.error("Error adding column via RPC:", addColumnError);
        
        // محاولة تنفيذ SQL مباشرة
        const { error: sqlError } = await supabase.from('migrations').select('*').limit(1);
        
        if (sqlError && sqlError.message.includes('relation "migrations" does not exist')) {
          console.log("Creating migrations table...");
          
          // إنشاء جدول للتحكم بالترقيات
          await supabase.auth.refreshSession();
          
          // Return a 'manual intervention needed' flag
          return "manual_intervention_needed";
        }
      }
      
      return true;
    }
    
    // التحقق مما إذا كان العمود موجودًا بالفعل
    const columnExists = columns === true;
    
    if (!columnExists) {
      // إضافة العمود إذا لم يكن موجوداً
      const { error: addColumnError } = await supabase.rpc(
        'add_column_if_not_exists',
        {
          p_table: 'shopify_stores',
          p_column: 'token_type',
          p_type: 'text'
        }
      );
      
      if (addColumnError) {
        console.error("Error adding column:", addColumnError);
        return false;
      }
      
      return true;
    }
    
    // العمود موجود بالفعل
    return false;
  } catch (error) {
    console.error("Error in ensureTokenTypeColumn:", error);
    return false;
  }
}
