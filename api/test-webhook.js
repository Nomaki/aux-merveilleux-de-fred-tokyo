/**
 * Test endpoint to manually trigger webhook processing logic
 * This allows testing the webhook without going through Stripe
 *
 * Usage: POST to /api/test-webhook with test payment data
 */

import { createClient } from '@supabase/supabase-js';

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  });
}

// Initialize Supabase client with service role key for server-side operations
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Test webhook endpoint called');

    // Create test payment intent data
    const testPaymentIntent = {
      id: 'pi_test_' + Date.now(),
      amount: 5000,
      metadata: {
        reservationCode: 'TEST-' + Date.now(),
        deliveryDateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        familyNameKanji: 'テスト',
        nameKanji: '太郎',
        familyNameKatakana: 'テスト',
        nameKatakana: 'タロウ',
        customerEmail: 'test@example.com',
        customerPhone: '090-1234-5678',
        cartItems: JSON.stringify([
          {
            id: 'cake-1',
            name: 'テストケーキ',
            price: 5000,
            quantity: 1
          }
        ]),
      },
      receipt_email: 'test@example.com',
    };

    console.log('📋 Test payment intent:', {
      id: testPaymentIntent.id,
      reservationCode: testPaymentIntent.metadata.reservationCode,
      email: testPaymentIntent.metadata.customerEmail,
    });

    // Parse cart items from metadata
    let cartItems = [];
    try {
      cartItems = JSON.parse(testPaymentIntent.metadata.cartItems || '[]');
    } catch (e) {
      console.error('❌ Failed to parse cart items:', e);
    }

    // Prepare order data for Supabase
    const orderData = {
      reservation_code: testPaymentIntent.metadata.reservationCode,
      payment_intent_id: testPaymentIntent.id,
      customer_name_kanji: `${testPaymentIntent.metadata.familyNameKanji || ''} ${testPaymentIntent.metadata.nameKanji || ''}`.trim(),
      customer_name_katakana: `${testPaymentIntent.metadata.familyNameKatakana || ''} ${testPaymentIntent.metadata.nameKatakana || ''}`.trim(),
      email: testPaymentIntent.metadata.customerEmail || testPaymentIntent.receipt_email || '',
      phone_number: testPaymentIntent.metadata.customerPhone || '',
      delivery_date_time: testPaymentIntent.metadata.deliveryDateTime || new Date().toISOString(),
      cart_items: cartItems,
      total_amount: testPaymentIntent.amount,
      payment_status: 'completed',
    };

    console.log('🔍 Attempting to insert order:', {
      reservation_code: orderData.reservation_code,
      payment_intent_id: orderData.payment_intent_id,
      email: orderData.email,
    });

    // Insert order into Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('❌ Failed to save order to Supabase:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      console.error('❌ Full Supabase error:', JSON.stringify(error, null, 2));

      return res.status(500).json({
        success: false,
        error: 'Failed to insert order',
        details: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      });
    }

    console.log('✅ Test order saved to Supabase:', data);

    return res.status(200).json({
      success: true,
      message: 'Test order created successfully',
      order: data[0],
    });

  } catch (error) {
    console.error('❌ Error in test webhook handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
