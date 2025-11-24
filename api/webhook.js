export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  console.log('🎯 Webhook invoked');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lazy load dependencies
    const Stripe = (await import('stripe')).default;
    const { createClient } = await import('@supabase/supabase-js');
    const { Resend } = await import('resend');
    const { generateConfirmationEmail } = await import('./templates/confirmation-email.js');
    const { generateAdminNotificationEmail } = await import('./templates/admin-notification-email.js');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const ADMIN_EMAIL = 'romain.delhoute+amf@gmail.com';

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

    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    let event;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      console.log('✅ Signature verified');
    } else {
      event = JSON.parse(buf.toString());
      console.warn('⚠️ No signature');
    }

    console.log('Event:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;

      let cartItems = [];
      try {
        cartItems = JSON.parse(metadata.cartItems || '[]');
      } catch (e) {
        console.error('Cart parse error:', e);
      }

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

      console.log('💾 Saving order');
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('✅ Order saved');

        try {
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

          const customerEmailHtml = generateConfirmationEmail({
            reservationCode: orderData.reservation_code,
            order: emailOrderData,
            language,
          });

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: [orderData.email],
            subject: language === 'ja'
              ? `【ご予約確認】予約番号: ${orderData.reservation_code}`
              : `Reservation Confirmation - Code: ${orderData.reservation_code}`,
            html: customerEmailHtml,
          });

          const adminEmailHtml = generateAdminNotificationEmail({
            reservationCode: orderData.reservation_code,
            order: emailOrderData,
          });

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: [ADMIN_EMAIL],
            subject: `🔔 New Order - ${orderData.reservation_code}`,
            html: adminEmailHtml,
          });

          console.log('✅ Emails sent');
        } catch (emailError) {
          console.error('Email error:', emailError);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
