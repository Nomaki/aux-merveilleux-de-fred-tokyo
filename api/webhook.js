import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

// This is your Stripe webhook secret
// You'll get this when you set up the webhook in Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing, need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the raw body for signature verification
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(buf.toString());
      console.warn('⚠️ Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET)');
    }
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);

      try {
        // Extract order data from payment intent metadata
        const metadata = paymentIntent.metadata;

        if (!metadata.reservationCode) {
          console.error('❌ No reservation code in payment intent metadata');
          break;
        }

        // Parse cart items from metadata (stored as JSON string)
        let cartItems = [];
        try {
          cartItems = JSON.parse(metadata.cartItems || '[]');
        } catch (e) {
          console.error('❌ Failed to parse cart items:', e);
        }

        // Prepare order data for Supabase
        const orderData = {
          reservation_code: metadata.reservationCode,
          payment_intent_id: paymentIntent.id,
          customer_name_kanji: `${metadata.familyNameKanji || ''} ${metadata.nameKanji || ''}`.trim(),
          customer_name_katakana: `${metadata.familyNameKatakana || ''} ${metadata.nameKatakana || ''}`.trim(),
          email: metadata.customerEmail || paymentIntent.receipt_email || '',
          phone_number: metadata.customerPhone || '',
          delivery_date_time: metadata.deliveryDateTime || new Date().toISOString(),
          cart_items: cartItems,
          total_amount: paymentIntent.amount,
          payment_status: 'completed',
        };

        // Insert order into Supabase
        console.log('🔍 Attempting to insert order:', {
          reservation_code: orderData.reservation_code,
          payment_intent_id: orderData.payment_intent_id,
          email: orderData.email,
        });

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
          // Log the full error object for debugging
          console.error('❌ Full Supabase error:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Order saved to Supabase:', data);
        }
      } catch (error) {
        console.error('❌ Error processing payment success:', error);
      }

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ PaymentIntent failed:', failedPayment.id);

      try {
        const metadata = failedPayment.metadata;

        if (metadata.reservationCode) {
          // Update order status to failed if it exists
          const { error } = await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('reservation_code', metadata.reservationCode);

          if (error) {
            console.error('❌ Failed to update order status:', error);
          } else {
            console.log('✅ Order status updated to failed');
          }
        }
      } catch (error) {
        console.error('❌ Error processing payment failure:', error);
      }

      break;

    case 'charge.succeeded':
      const charge = event.data.object;
      console.log('💳 Charge succeeded:', charge.id);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('💸 Charge refunded:', refund.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}
