-- Check current policies on quantity_offers
SELECT policyname FROM pg_policies WHERE tablename = 'quantity_offers';