import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateConfirmationEmail } from './templates/confirmation-email.js';
import { generateAdminNotificationEmail } from './templates/admin-notification-email.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

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

// Vercel handles raw body automatically when bodyParser is disabled
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60, // Allow up to 60 seconds for this function
};

// Helper to read raw body from request
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Log immediately to confirm function is invoked
  console.log('🎯 Webhook handler invoked:', new Date().toISOString());
  console.log('📥 Request method:', req.method);
  console.log('📋 Headers:', JSON.stringify(req.headers));

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📖 Reading request body...');
    // Get the raw body for signature verification
    const buf = await getRawBody(req);
    console.log('✅ Body read successfully, length:', buf.length);

    const sig = req.headers['stripe-signature'];
    console.log('🔑 Stripe signature present:', !!sig);

    let event;

    try {
      // Verify the webhook signature
      if (webhookSecret) {
        console.log('🔐 Verifying webhook signature...');
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
        console.log('✅ Signature verified, event type:', event.type);
      } else {
        // For development without webhook secret
        console.warn('⚠️ Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET)');
        event = JSON.parse(buf.toString());
      }
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      console.error('🔍 Error details:', err);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

  // Handle the event
  console.log('🔄 Processing event type:', event.type);

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('💳 Processing payment_intent.succeeded...');
      const paymentIntent = event.data.object;
      console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
      console.log('💰 Amount:', paymentIntent.amount, 'JPY');
      console.log('📧 Receipt email:', paymentIntent.receipt_email);

      try {
        console.log('📋 Starting order processing...');
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

            const language = metadata.language || 'ja';

            // Send customer confirmation email
            const customerEmailHtml = generateConfirmationEmail({
              reservationCode: orderData.reservation_code,
              order: emailOrderData,
              language,
            });

            const customerSubject = language === 'ja'
              ? `【ご予約確認】予約番号: ${orderData.reservation_code}`
              : `Reservation Confirmation - Code: ${orderData.reservation_code}`;

            const { data: customerEmailData, error: customerEmailError } = await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
              to: [orderData.email],
              subject: customerSubject,
              html: customerEmailHtml,
            });

            if (customerEmailError) {
              console.error('❌ Failed to send customer email:', customerEmailError);
            } else {
              console.log('✅ Customer email sent:', customerEmailData.id);
            }

            // Send admin notification email
            const adminEmailHtml = generateAdminNotificationEmail({
              reservationCode: orderData.reservation_code,
              order: emailOrderData,
            });

            const adminSubject = `🔔 新しいご予約 / New Order - ${orderData.reservation_code}`;

            const { data: adminEmailData, error: adminEmailError } = await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
              to: [ADMIN_EMAIL],
              subject: adminSubject,
              html: adminEmailHtml,
            });

            if (adminEmailError) {
              console.error('❌ Failed to send admin email:', adminEmailError);
            } else {
              console.log('✅ Admin email sent:', adminEmailData.id);
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
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
