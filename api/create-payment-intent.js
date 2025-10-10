import Stripe from 'stripe';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, orderData } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in smallest currency unit (yen)
      currency: 'jpy', // Japanese Yen
      automatic_payment_methods: {
        enabled: true,
      },
      // Optional: Add metadata for tracking
      metadata: {
        orderDate: orderData?.deliveryDateTime || new Date().toISOString(),
        customerName: orderData?.nameKanji || 'Unknown',
      },
    });

    // Return the client secret to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

    res.status(500).json({
      error: 'Payment intent creation failed',
      message: error.message,
    });
  }
}
