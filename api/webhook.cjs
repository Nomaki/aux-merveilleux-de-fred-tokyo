const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

// Initialize Supabase
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

// Helper to read raw body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  console.log('🎯 Webhook invoked:', new Date().toISOString());

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    let event;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      console.log('✅ Signature verified');
    } else {
      event = JSON.parse(buf.toString());
      console.warn('⚠️ No signature verification');
    }

    console.log('📩 Event type:', event.type);

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;

      console.log('💳 Payment succeeded:', paymentIntent.id);
      console.log('📝 Reservation:', metadata.reservationCode);

      // Parse cart items
      let cartItems = [];
      try {
        cartItems = JSON.parse(metadata.cartItems || '[]');
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }

      // Save to Supabase
      const orderData = {
        reservation_code: metadata.reservationCode,
        payment_intent_id: paymentIntent.id,
        customer_name_kanji: `${metadata.familyNameKanji || ''} ${metadata.nameKanji || ''}`.trim(),
        customer_name_katakana: `${metadata.familyNameKatakana || ''} ${metadata.nameKatakana || ''}`.trim(),
        email: metadata.customerEmail || '',
        phone_number: metadata.customerPhone || '',
        delivery_date_time: metadata.deliveryDateTime || new Date().toISOString(),
        cart_items: cartItems,
        total_amount: paymentIntent.amount,
        payment_status: 'completed',
      };

      console.log('💾 Saving to Supabase...');
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
      } else {
        console.log('✅ Order saved:', data[0]?.id);

        // Send confirmation emails
        try {
          console.log('📧 Sending emails...');

          // Dynamically import email templates (ES modules)
          const { generateConfirmationEmail } = await import('./templates/confirmation-email.js');
          const { generateAdminNotificationEmail } = await import('./templates/admin-notification-email.js');

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

          // Customer email
          const customerEmailHtml = generateConfirmationEmail({
            reservationCode: orderData.reservation_code,
            order: emailOrderData,
            language,
          });

          const customerSubject = language === 'ja'
            ? `【ご予約確認】予約番号: ${orderData.reservation_code}`
            : `Reservation Confirmation - Code: ${orderData.reservation_code}`;

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: [orderData.email],
            subject: customerSubject,
            html: customerEmailHtml,
          });
          console.log('✅ Customer email sent');

          // Admin email
          const adminEmailHtml = generateAdminNotificationEmail({
            reservationCode: orderData.reservation_code,
            order: emailOrderData,
          });

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: [ADMIN_EMAIL],
            subject: `🔔 新しいご予約 / New Order - ${orderData.reservation_code}`,
            html: adminEmailHtml,
          });
          console.log('✅ Admin email sent');
        } catch (emailError) {
          console.error('❌ Email error:', emailError);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
