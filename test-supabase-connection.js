/**
 * Test Supabase connection and diagnose issues
 * Run with: node test-supabase-connection.js
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

console.log('🔍 Testing Supabase Connection\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY?.length + ')' : '❌ MISSING');
console.log('');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testConnection() {
  try {
    // Test 1: Check if we can query the orders table
    console.log('Test 1: Querying orders table...');
    const { data: orders, error: queryError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (queryError) {
      console.error('❌ Query failed:', queryError);
    } else {
      console.log(`✅ Query successful! Found ${orders.length} orders`);
      if (orders.length > 0) {
        console.log('   Sample order:', {
          id: orders[0].id,
          reservation_code: orders[0].reservation_code,
          email: orders[0].email,
        });
      }
    }
    console.log('');

    // Test 2: Try to insert a test order
    console.log('Test 2: Inserting test order...');
    const testOrder = {
      reservation_code: `TEST${Date.now()}`,
      payment_intent_id: `pi_test_${Date.now()}`,
      customer_name_kanji: 'テスト 太郎',
      customer_name_katakana: 'テスト タロウ',
      email: 'test@example.com',
      phone_number: '090-1234-5678',
      delivery_date_time: new Date(Date.now() + 86400000).toISOString(),
      cart_items: [
        {
          cakeType: 'merveilleux',
          cakeSize: 4,
          quantity: 1,
          serviceType: 'takeout',
        }
      ],
      total_amount: 5000,
      payment_status: 'completed',
    };

    console.log('   Attempting to insert:', {
      reservation_code: testOrder.reservation_code,
      email: testOrder.email,
    });

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });

      // Provide specific guidance based on error
      if (insertError.code === '42501' || insertError.message?.includes('policy')) {
        console.error('\n🔒 RLS POLICY ERROR DETECTED!');
        console.error('   The service role does not have permission to insert rows.');
        console.error('\n   ⚠️  ACTION REQUIRED:');
        console.error('   Go to your Supabase Dashboard → SQL Editor');
        console.error('   Run the SQL in supabase-setup.sql file\n');
      }

      if (insertError.code === '42P01') {
        console.error('\n📋 TABLE NOT FOUND!');
        console.error('   The orders table does not exist.');
        console.error('   Create it in Supabase Dashboard\n');
      }

      if (insertError.code === '23502') {
        console.error('\n⚠️  MISSING REQUIRED FIELD!');
        console.error('   Details:', insertError.message);
        console.error('   Check your table schema\n');
      }
    } else {
      console.log('✅ Insert successful!');
      console.log('   Inserted order:', {
        id: insertedOrder[0].id,
        reservation_code: insertedOrder[0].reservation_code,
      });

      // Clean up test order
      console.log('\nTest 3: Cleaning up test order...');
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('reservation_code', testOrder.reservation_code);

      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
        console.warn('   ⚠️  Please manually delete test order:', testOrder.reservation_code);
      } else {
        console.log('✅ Test order deleted successfully');
      }
    }
    console.log('');

    // Test 3: Check table schema
    console.log('Test 4: Checking table schema...');
    const { data: tableInfo, error: schemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
    } else {
      console.log('✅ Table exists and is accessible');
    }

    console.log('\n✨ Testing complete!\n');
    console.log('📋 Summary:');
    console.log('   - If all tests passed, your Supabase is configured correctly');
    console.log('   - If insert failed with RLS error, run supabase-setup.sql in your dashboard');
    console.log('   - Check Vercel environment variables if this works locally but not in production\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testConnection();
