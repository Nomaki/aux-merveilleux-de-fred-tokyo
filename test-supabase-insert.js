/**
 * Test script to verify Supabase connection and insert permissions
 * Run with: node test-supabase-insert.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  SUPABASE_URL:', SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Supabase client initialized\n');

// Test 1: Check if orders table exists
console.log('Test 1: Checking if orders table exists...');
try {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing orders table:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
  } else {
    console.log('✅ Orders table exists and is accessible');
    console.log('   Found', data?.length || 0, 'existing orders\n');
  }
} catch (err) {
  console.error('❌ Exception:', err.message, '\n');
}

// Test 2: Try to insert a test order
console.log('Test 2: Attempting to insert a test order...');
const testOrder = {
  reservation_code: 'TEST-' + Date.now(),
  payment_intent_id: 'pi_test_' + Date.now(),
  customer_name_kanji: 'テスト 太郎',
  customer_name_katakana: 'テスト タロウ',
  email: 'test@example.com',
  phone_number: '090-1234-5678',
  delivery_date_time: new Date().toISOString(),
  cart_items: [
    {
      id: 'test-cake',
      name: 'テストケーキ',
      price: 5000,
      quantity: 1
    }
  ],
  total_amount: 5000,
  payment_status: 'completed',
};

console.log('Order data:', {
  reservation_code: testOrder.reservation_code,
  email: testOrder.email,
  total_amount: testOrder.total_amount,
});
console.log('');

try {
  const { data, error } = await supabase
    .from('orders')
    .insert([testOrder])
    .select();

  if (error) {
    console.error('❌ Failed to insert test order:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    console.error('');
    console.error('📋 Full error object:');
    console.error(JSON.stringify(error, null, 2));
    console.error('');

    // Check for RLS policy error
    if (error.code === '42501' || error.message?.includes('policy')) {
      console.error('🔒 This looks like a Row Level Security (RLS) policy error!');
      console.error('');
      console.error('Please run the following SQL in Supabase SQL Editor:');
      console.error('');
      console.error('-- Enable RLS');
      console.error('ALTER TABLE orders ENABLE ROW LEVEL SECURITY;');
      console.error('');
      console.error('-- Allow service role full access');
      console.error('CREATE POLICY "Service role has full access" ON orders');
      console.error('  FOR ALL');
      console.error('  TO service_role');
      console.error('  USING (true)');
      console.error('  WITH CHECK (true);');
      console.error('');
    }
  } else {
    console.log('✅ Test order inserted successfully!');
    console.log('   Order ID:', data[0]?.id);
    console.log('   Reservation Code:', data[0]?.reservation_code);
    console.log('');

    // Clean up test order
    console.log('🧹 Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('reservation_code', testOrder.reservation_code);

    if (deleteError) {
      console.error('⚠️  Could not delete test order:', deleteError.message);
    } else {
      console.log('✅ Test order deleted successfully');
    }
  }
} catch (err) {
  console.error('❌ Exception during insert:', err.message);
  console.error(err);
}

console.log('');
console.log('🏁 Test completed!');
