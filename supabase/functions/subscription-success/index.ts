import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SuccessParams {
  shop: string;
  plan: string;
  charge_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const plan = url.searchParams.get('plan');
    const chargeId = url.searchParams.get('charge_id');

    if (!shop || !plan) {
      return new Response(JSON.stringify({ error: 'Missing shop or plan parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    console.log(`✅ Confirming subscription for shop: ${shop}, plan: ${plan}, charge: ${chargeId}`);

    // تأكيد الاشتراك وتحديث الحالة إلى نشط
    const { data, error } = await supabase.rpc('confirm_subscription_upgrade', {
      p_shop_domain: shop,
      p_plan_type: plan,
      p_shopify_charge_id: chargeId || null
    });

    if (error) {
      console.error('❌ Error confirming subscription:', error);
      throw error;
    }

    console.log('✅ Subscription confirmed successfully:', data);

    // إنشاء صفحة HTML للنجاح
    const successPage = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم تفعيل الاشتراك بنجاح</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .success-container {
                background: white;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
            }
            .checkmark {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: #22c55e;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 40px;
            }
            h1 {
                color: #1f2937;
                margin: 20px 0;
                font-size: 28px;
            }
            p {
                color: #6b7280;
                line-height: 1.6;
                font-size: 16px;
                margin: 15px 0;
            }
            .plan-info {
                background: #f8fafc;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #22c55e;
            }
            .plan-name {
                font-weight: bold;
                color: #1f2937;
                font-size: 18px;
            }
            .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
                margin-top: 20px;
                font-size: 16px;
                transition: background 0.3s;
            }
            .btn:hover {
                background: #5a67d8;
            }
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="checkmark">✓</div>
            <h1>تم تفعيل الاشتراك بنجاح!</h1>
            <p>تهانينا! لقد تم تفعيل اشتراكك في CODMagnet بنجاح.</p>
            
            <div class="plan-info">
                <div class="plan-name">خطة ${plan === 'basic' ? 'الأساسية' : plan === 'premium' ? 'المتقدمة' : plan}</div>
                <p>يمكنك الآن الاستفادة من جميع مميزات خطتك الجديدة.</p>
            </div>
            
            <p>سيتم توجيهك إلى لوحة التحكم خلال ثوانٍ قليلة.</p>
            <a href="https://codmagnet.com/dashboard" class="btn">الذهاب إلى لوحة التحكم</a>
        </div>

        <script>
            // التوجيه التلقائي بعد 5 ثوان
            setTimeout(() => {
                window.location.href = 'https://codmagnet.com/dashboard';
            }, 5000);
        </script>
    </body>
    </html>
    `;

    return new Response(successPage, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('subscription-success error:', message);
    
    // صفحة خطأ
    const errorPage = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>خطأ في تفعيل الاشتراك</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .error-container {
                background: white;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
            }
            .error-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: #ef4444;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 40px;
            }
            h1 {
                color: #1f2937;
                margin: 20px 0;
                font-size: 28px;
            }
            p {
                color: #6b7280;
                line-height: 1.6;
                font-size: 16px;
                margin: 15px 0;
            }
            .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
                margin-top: 20px;
                font-size: 16px;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">✗</div>
            <h1>حدث خطأ أثناء تفعيل الاشتراك</h1>
            <p>عذراً، حدث خطأ أثناء تفعيل اشتراكك. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.</p>
            <a href="https://codmagnet.com/plans" class="btn">العودة إلى الخطط</a>
        </div>
    </body>
    </html>
    `;

    return new Response(errorPage, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 500,
    });
  }
});