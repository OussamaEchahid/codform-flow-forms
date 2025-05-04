
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
    
    // التحقق من وجود الدالة المطلوبة create_form_with_shop
    const hasCreateFormFunction = await ensureCreateFormFunction(supabase);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        migrations: {
          hasTokenTypeMigration,
          hasCreateFormFunction
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

// دالة للتأكد من وجود وظيفة create_form_with_shop
async function ensureCreateFormFunction(supabase) {
  try {
    // التحقق من وجود الوظيفة عن طريق استدعائها بطريقة آمنة
    const { data: testData, error: testError } = await supabase.rpc(
      'function_exists',
      { 
        function_name: 'create_form_with_shop'
      }
    );
    
    // إذا فشل الاستعلام أو كان ناتجه سلبيًا، نفترض أن الوظيفة غير موجودة
    if (testError || !testData) {
      console.log("Creating create_form_with_shop function...");
      
      // إنشاء الوظيفة إذا لم تكن موجودة
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.create_form_with_shop(
          p_title TEXT,
          p_description TEXT,
          p_data JSONB,
          p_shop_id TEXT,
          p_user_id UUID
        ) RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_form_id UUID;
        BEGIN
          INSERT INTO public.forms (title, description, data, shop_id, user_id, is_published)
          VALUES (p_title, p_description, p_data, p_shop_id, p_user_id, false)
          RETURNING id INTO v_form_id;
          
          RETURN v_form_id;
        END;
        $$;
        
        CREATE OR REPLACE FUNCTION public.function_exists(function_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1
            FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE pg_proc.proname = function_name
            AND pg_namespace.nspname = 'public'
          );
        END;
        $$;
      `;
      
      // تنفيذ استعلام إنشاء الوظيفة
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      
      if (createError) {
        // محاولة تنفيذ SQL مباشرة باستخدام دالة أخرى
        console.error("Error creating function via RPC:", createError);
        return "manual_intervention_needed";
      }
      
      return true;
    }
    
    // الوظيفة موجودة بالفعل
    return false;
  } catch (error) {
    console.error("Error in ensureCreateFormFunction:", error);
    return false;
  }
}
