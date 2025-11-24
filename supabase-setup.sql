-- ============================================================================
-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor to ensure all policies are correct
-- ============================================================================

-- Step 1: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Service role has full access" ON orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
DROP POLICY IF EXISTS "Anon users cannot access orders" ON orders;

-- Step 2: Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy for service role (used by API routes)
-- This is the CRITICAL policy that allows webhook to insert orders
CREATE POLICY "Service role has full access" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 4: Create policy for authenticated users (future feature)
-- Users can only read their own orders by email
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Step 5: Block anonymous access
-- All operations must go through API routes (which use service role)
CREATE POLICY "Anon users cannot access orders" ON orders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Step 6: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- Expected output:
-- | policyname                      | roles         | cmd    |
-- |---------------------------------|---------------|--------|
-- | Anon users cannot access orders | anon          | ALL    |
-- | Service role has full access    | service_role  | ALL    |
-- | Users can read their own orders | authenticated | SELECT |

-- ============================================================================
-- Test Insert (Optional - for testing)
-- ============================================================================

-- Uncomment to test if service role can insert:
/*
INSERT INTO orders (
  reservation_code,
  payment_intent_id,
  customer_name_kanji,
  customer_name_katakana,
  email,
  phone_number,
  delivery_date_time,
  cart_items,
  total_amount,
  payment_status
) VALUES (
  'TEST-' || extract(epoch from now())::text,
  'pi_test_' || extract(epoch from now())::text,
  'テスト 太郎',
  'テスト タロウ',
  'test@example.com',
  '090-1234-5678',
  now() + interval '1 day',
  '[{"id":"test","name":"テストケーキ","price":5000,"quantity":1}]'::jsonb,
  5000,
  'completed'
);

-- Clean up test data
DELETE FROM orders WHERE reservation_code LIKE 'TEST-%';
*/

-- ============================================================================
-- Debugging Queries
-- ============================================================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'orders';
-- Expected: rowsecurity = true

-- Check current role
SELECT current_user, session_user;

-- Count existing orders
SELECT COUNT(*) as total_orders FROM orders;

-- View recent orders
SELECT
  id,
  reservation_code,
  email,
  total_amount,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
