import Stripe from 'stripe';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, orderData, language = 'ja', paymentMethod = 'card' } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Prepare payment intent configuration
    const paymentIntentConfig = {
      amount: Math.round(amount), // Amount in smallest currency unit (yen)
      currency: 'jpy', // Japanese Yen
      metadata: {
        orderDate: orderData?.deliveryDateTime || new Date().toISOString(),
        customerName: orderData?.nameKanji || 'Unknown',
        customerEmail: orderData?.email || '',
        language: language,
        paymentMethod: paymentMethod,
      },
    };

    // Configure payment methods based on the requested method
    if (paymentMethod === 'paypay') {
      // Note: PayPay through Stripe requires enabling PayPay in your Stripe dashboard
      // and may require additional setup for Japanese market
      paymentIntentConfig.payment_method_types = ['paypay'];
    } else {
      // Default: allow all automatic payment methods (cards, etc.)
      paymentIntentConfig.automatic_payment_methods = {
        enabled: true,
      };
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

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
