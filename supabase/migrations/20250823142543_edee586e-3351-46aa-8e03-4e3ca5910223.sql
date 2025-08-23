-- تصحيح أسعار الاشتراكات لتتطابق مع الأسعار الفعلية في Shopify
-- وإصلاح آلية تحديث حالة الاشتراك

-- تحديث دالة upgrade_shop_plan لتتطابق مع الأسعار الصحيحة
CREATE OR REPLACE FUNCTION public.upgrade_shop_plan(p_shop_domain text, p_new_plan subscription_plan, p_shopify_charge_id text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  plan_prices RECORD;
BEGIN
  -- تحديد أسعار الخطط - نفس الأسعار المستخدمة في Shopify
  SELECT 
    CASE p_new_plan
      WHEN 'free' THEN 0.00
      WHEN 'basic' THEN 11.85  -- تصحيح السعر ليتطابق مع Shopify
      WHEN 'premium' THEN 22.85 -- تصحيح السعر ليتطابق مع Shopify
      WHEN 'unlimited' THEN 99.99
    END as price
  INTO plan_prices;

  -- تحديث الاشتراك
  UPDATE shop_subscriptions 
  SET 
    plan_type = p_new_plan,
    price_amount = plan_prices.price,
    shopify_charge_id = COALESCE(p_shopify_charge_id, shopify_charge_id),
    status = CASE 
      WHEN p_new_plan = 'free' THEN 'active'
      WHEN p_shopify_charge_id IS NOT NULL THEN 'active' -- إذا تم تأكيد الدفع، اجعل الحالة نشطة
      ELSE 'pending' -- وإلا ابقها معلقة
    END,
    next_billing_date = CASE 
      WHEN p_new_plan = 'free' THEN NULL
      ELSE now() + INTERVAL '1 month'
    END,
    updated_at = now()
  WHERE shop_domain = p_shop_domain;

  -- إذا لم يوجد اشتراك، أنشئ واحداً جديداً
  IF NOT FOUND THEN
    INSERT INTO shop_subscriptions (
      shop_domain, 
      plan_type, 
      price_amount, 
      shopify_charge_id,
      status,
      next_billing_date
    ) VALUES (
      p_shop_domain,
      p_new_plan,
      plan_prices.price,
      p_shopify_charge_id,
      CASE 
        WHEN p_new_plan = 'free' THEN 'active'
        WHEN p_shopify_charge_id IS NOT NULL THEN 'active'
        ELSE 'pending'
      END,
      CASE 
        WHEN p_new_plan = 'free' THEN NULL
        ELSE now() + INTERVAL '1 month'
      END
    );
  END IF;

  RETURN true;
END;
$function$;

-- إنشاء دالة لتأكيد الاشتراك عند إتمام الدفع
CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(p_shop_domain text, p_shopify_charge_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تحديث حالة الاشتراك إلى نشط بعد تأكيد الدفع
  UPDATE shop_subscriptions 
  SET 
    status = 'active',
    shopify_charge_id = p_shopify_charge_id,
    subscription_started_at = now(),
    updated_at = now()
  WHERE shop_domain = p_shop_domain 
    AND status = 'pending';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Subscription activated successfully'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No pending subscription found'
    );
  END IF;
END;
$function$;