import Stripe from 'stripe';
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
  // Vercel automatically provides req.body as Buffer for webhooks
  const buf = req.body;
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = typeof buf === 'string' ? JSON.parse(buf) : buf;
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
      console.log('💰 Amount:', paymentIntent.amount, 'JPY');
      console.log('📧 Receipt email:', paymentIntent.receipt_email);

      try {
        // Extract order data from payment intent metadata
        const metadata = paymentIntent.metadata;
        console.log('📋 Payment metadata:', JSON.stringify(metadata, null, 2));

        if (!metadata.reservationCode) {
          console.error('❌ No reservation code in payment intent metadata');
          console.error('❌ This payment will not be saved to the database!');
          console.error('📋 Full payment intent:', JSON.stringify(paymentIntent, null, 2));
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

          // CRITICAL: Log the order data so it can be manually recovered
          console.error('📦 FAILED ORDER DATA (MANUAL RECOVERY REQUIRED):', JSON.stringify(orderData, null, 2));

          // Check for common issues
          if (error.code === '42501' || error.message?.includes('policy')) {
            console.error('🔒 RLS POLICY ERROR: Service role might not have permission to insert rows.');
            console.error('   Run this SQL in Supabase:');
            console.error('   CREATE POLICY "Service role has full access" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);');
          }

          if (error.code === '23505' || error.message?.includes('duplicate')) {
            console.error('⚠️  DUPLICATE KEY ERROR: An order with this reservation code already exists.');
          }

          if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('⚠️  ENVIRONMENT VARIABLE ERROR: Supabase credentials might not be set in production.');
          }
        } else {
          console.log('✅ Order saved to Supabase successfully:', {
            id: data[0]?.id,
            reservation_code: data[0]?.reservation_code,
            email: data[0]?.email,
            total_amount: data[0]?.total_amount,
          });

          // Send confirmation emails after successful order save
          try {
            console.log('📧 Sending confirmation emails...');

            // Prepare order data for email
            const emailOrderData = {
              familyNameKanji: metadata.familyNameKanji || '',
              nameKanji: metadata.nameKanji || '',
              familyNameKatakana: metadata.familyNameKatakana || '',
              nameKatakana: metadata.nameKatakana || '',
              email: orderData.email,
              phoneNumber: orderData.phone_number,
              deliveryDateTime: orderData.delivery_date_time,
              cartItems: cartItems,
              totalAmount: orderData.total_amount,
            };

            // Call the send confirmation email endpoint
            const emailResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/send-confirmation-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                confirmationData: {
                  reservationCode: orderData.reservation_code,
                  order: emailOrderData,
                },
                language: metadata.language || 'ja',
              }),
            });

            if (!emailResponse.ok) {
              const errorData = await emailResponse.json();
              console.error('❌ Failed to send confirmation email:', errorData);
            } else {
              const emailData = await emailResponse.json();
              console.log('✅ Confirmation emails sent successfully:', emailData);
            }
          } catch (emailError) {
            console.error('❌ Error sending confirmation emails:', emailError);
            // Don't fail the webhook if email sending fails
          }
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
