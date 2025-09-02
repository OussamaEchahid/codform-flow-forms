-- إصلاح دالة confirm_subscription_payment لتعيين next_billing_date
CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(p_shop_domain text, p_shopify_charge_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription_record RECORD;
BEGIN
  -- الحصول على بيانات الاشتراك الحالي
  SELECT * INTO v_subscription_record
  FROM shop_subscriptions 
  WHERE shop_domain = p_shop_domain 
    AND status = 'pending';

  IF NOT FOUND THEN
    -- محاولة العثور على أي اشتراك للمتجر
    SELECT * INTO v_subscription_record
    FROM shop_subscriptions 
    WHERE shop_domain = p_shop_domain;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No subscription found for this shop'
      );
    END IF;
  END IF;

  -- تحديث حالة الاشتراك إلى نشط مع تعيين next_billing_date
  UPDATE shop_subscriptions 
  SET 
    status = 'active',
    shopify_charge_id = p_shopify_charge_id,
    subscription_started_at = now(),
    next_billing_date = CASE 
      WHEN plan_type = 'free' THEN NULL
      ELSE now() + INTERVAL '1 month'
    END,
    -- نسخ requested_plan_type إلى plan_type إذا كان موجود
    plan_type = COALESCE(requested_plan_type, plan_type),
    -- مسح requested_plan_type بعد التفعيل
    requested_plan_type = NULL,
    requested_at = NULL,
    updated_at = now()
  WHERE shop_domain = p_shop_domain;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Subscription activated successfully',
      'next_billing_date', CASE 
        WHEN v_subscription_record.plan_type = 'free' THEN NULL
        ELSE (now() + INTERVAL '1 month')::text
      END
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update subscription'
    );
  END IF;
END;
$function$;
