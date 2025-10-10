import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

      // Here you would:
      // 1. Update your database with the payment confirmation
      // 2. Send confirmation email to customer
      // 3. Update order status
      // Example:
      // await updateOrder(paymentIntent.metadata.orderId, { status: 'paid' });

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ PaymentIntent failed:', failedPayment.id);

      // Handle failed payment
      // Example: Send notification to admin, update order status

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
