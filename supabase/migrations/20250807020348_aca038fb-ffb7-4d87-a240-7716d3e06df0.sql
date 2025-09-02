-- Create function to get order settings
CREATE OR REPLACE FUNCTION public.get_order_settings(p_shop_id text)
RETURNS TABLE(
  id uuid,
  shop_id text,
  user_id uuid,
  post_order_action text,
  redirect_enabled boolean,
  thank_you_page_url text,
  popup_title text,
  popup_message text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    os.id,
    os.shop_id,
    os.user_id,
    os.post_order_action,
    os.redirect_enabled,
    os.thank_you_page_url,
    os.popup_title,
    os.popup_message,
    os.created_at,
    os.updated_at
  FROM order_settings os
  WHERE os.shop_id = p_shop_id;
END;
$$;

-- Create function to save order settings
CREATE OR REPLACE FUNCTION public.save_order_settings(
  p_shop_id text,
  p_post_order_action text DEFAULT 'redirect',
  p_redirect_enabled boolean DEFAULT true,
  p_thank_you_page_url text DEFAULT '',
  p_popup_title text DEFAULT 'Order Created Successfully!',
  p_popup_message text DEFAULT 'Thank you for your order! We''ll contact you soon to confirm the details. Please keep your phone nearby.'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO order_settings (
    shop_id,
    post_order_action,
    redirect_enabled,
    thank_you_page_url,
    popup_title,
    popup_message,
    updated_at
  ) VALUES (
    p_shop_id,
    p_post_order_action,
    p_redirect_enabled,
    p_thank_you_page_url,
    p_popup_title,
    p_popup_message,
    now()
  )
  ON CONFLICT (shop_id)
  DO UPDATE SET
    post_order_action = p_post_order_action,
    redirect_enabled = p_redirect_enabled,
    thank_you_page_url = p_thank_you_page_url,
    popup_title = p_popup_title,
    popup_message = p_popup_message,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;