-- إنشاء trigger لحماية الطلبات من حفظ أسعار 0.00 في المستقبل
CREATE OR REPLACE FUNCTION prevent_zero_price_orders()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  default_price numeric;
  form_currency text;
BEGIN
  -- التحقق إذا كان total_amount هو 0 أو null
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 1 THEN
    -- الحصول على العملة من النموذج المرتبط
    SELECT currency INTO form_currency
    FROM forms 
    WHERE id::text = NEW.form_id 
    LIMIT 1;
    
    -- تحديد السعر الافتراضي حسب العملة
    CASE 
      WHEN form_currency = 'SAR' OR NEW.currency = 'SAR' THEN
        default_price := 250.00;
      WHEN form_currency = 'MAD' OR NEW.currency = 'MAD' THEN
        default_price := 400.00;
      WHEN form_currency = 'USD' OR NEW.currency = 'USD' THEN
        default_price := 150.00;
      WHEN form_currency = 'AED' OR NEW.currency = 'AED' THEN
        default_price := 200.00;
      ELSE
        default_price := 250.00; -- الافتراضي
    END CASE;
    
    -- تطبيق السعر الافتراضي
    NEW.total_amount := default_price;
    NEW.currency := COALESCE(form_currency, NEW.currency, 'SAR');
    
    -- تحديث العناصر أيضاً
    NEW.items := jsonb_build_array(
      jsonb_build_object(
        'title', 'طلب من النموذج - Form Order',
        'quantity', 1,
        'price', default_price::text
      )
    );
    
    RAISE NOTICE 'تم تطبيق السعر الافتراضي: % % للطلب: %', default_price, NEW.currency, NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتطبيق هذه الحماية على كل طلب جديد أو محدث
CREATE TRIGGER prevent_zero_price_orders_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_zero_price_orders();