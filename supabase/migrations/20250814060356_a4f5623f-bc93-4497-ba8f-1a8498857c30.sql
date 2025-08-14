-- Create a function to fix orders with zero prices
CREATE OR REPLACE FUNCTION fix_orders_prices()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE orders 
  SET 
    total_amount = CASE 
      WHEN currency = 'SAR' THEN 250.00
      WHEN currency = 'USD' THEN 150.00  
      WHEN currency = 'MAD' THEN 400.00
      ELSE 100.00
    END,
    items = CASE 
      WHEN currency = 'SAR' THEN '[{"title": "طلب من النموذج - Form Order", "quantity": 1, "price": "250.00"}]'::jsonb
      WHEN currency = 'USD' THEN '[{"title": "طلب من النموذج - Form Order", "quantity": 1, "price": "150.00"}]'::jsonb
      WHEN currency = 'MAD' THEN '[{"title": "طلب من النموذج - Form Order", "quantity": 1, "price": "400.00"}]'::jsonb
      ELSE '[{"title": "طلب من النموذج - Form Order", "quantity": 1, "price": "100.00"}]'::jsonb
    END
  WHERE total_amount = 0;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RETURN 'Fixed ' || affected_count || ' orders with zero prices';
END;
$$;