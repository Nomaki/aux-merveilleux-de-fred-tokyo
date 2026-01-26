import Stripe from 'stripe';

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tax rates in Japan:
// - Takeout (軽減税率): 8%
// - Take-in/Dine-in (標準税率): 10%
const TAX_RATES = {
  takeout: 0.08,
  takein: 0.10,
};

// Calculate tax breakdown from cart items (prices are tax-inclusive)
function calculateTaxBreakdown(cartItems) {
  let takeoutTotal = 0;
  let takeinTotal = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.quantity;
    // Birthday plate is always takeout (8%)
    if (item.cakeType === 'plate' || item.serviceType === 'takeout') {
      takeoutTotal += itemTotal;
    } else {
      takeinTotal += itemTotal;
    }
  });

  // Calculate tax amounts (prices are tax-inclusive, so we extract the tax)
  // Formula: tax = total - (total / (1 + rate)) = total * rate / (1 + rate)
  const takeoutTax = Math.round(takeoutTotal * TAX_RATES.takeout / (1 + TAX_RATES.takeout));
  const takeinTax = Math.round(takeinTotal * TAX_RATES.takein / (1 + TAX_RATES.takein));

  const takeoutSubtotal = takeoutTotal - takeoutTax;
  const takeinSubtotal = takeinTotal - takeinTax;

  return {
    takeout: {
      subtotal: takeoutSubtotal,
      tax: takeoutTax,
      total: takeoutTotal,
      rate: '8%',
    },
    takein: {
      subtotal: takeinSubtotal,
      tax: takeinTax,
      total: takeinTotal,
      rate: '10%',
    },
    totalSubtotal: takeoutSubtotal + takeinSubtotal,
    totalTax: takeoutTax + takeinTax,
    grandTotal: takeoutTotal + takeinTotal,
  };
}

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

    // Prepare customer name for Stripe
    const customerName = orderData?.familyNameKanji && orderData?.nameKanji
      ? `${orderData.familyNameKanji} ${orderData.nameKanji}`
      : 'Unknown';

    // Prepare description for Stripe dashboard
    const description = orderData?.reservationCode
      ? `Birthday Cake Order - ${orderData.reservationCode} - ${customerName}`
      : `Birthday Cake Order - ${customerName}`;

    // Calculate tax breakdown from cart items
    const taxBreakdown = calculateTaxBreakdown(orderData?.cartItems || []);

    // Prepare payment intent configuration
    const paymentIntentConfig = {
      amount: Math.round(amount), // Amount in smallest currency unit (yen)
      currency: 'jpy', // Japanese Yen
      description: description,
      metadata: {
        reservationCode: orderData?.reservationCode || '',
        deliveryDateTime: orderData?.deliveryDateTime || new Date().toISOString(),
        familyNameKanji: orderData?.familyNameKanji || '',
        nameKanji: orderData?.nameKanji || '',
        familyNameKatakana: orderData?.familyNameKatakana || '',
        nameKatakana: orderData?.nameKatakana || '',
        customerEmail: orderData?.email || '',
        customerPhone: orderData?.phoneNumber || '',
        cartItems: JSON.stringify(orderData?.cartItems || []),
        candleCount: orderData?.candleCount || '',
        visitorCount: orderData?.visitorCount || '',
        language: language,
        paymentMethod: paymentMethod,
        // Tax breakdown for accounting (prices are tax-inclusive)
        tax_takeout_subtotal: String(taxBreakdown.takeout.subtotal),
        tax_takeout_amount: String(taxBreakdown.takeout.tax),
        tax_takeout_total: String(taxBreakdown.takeout.total),
        tax_takeout_rate: taxBreakdown.takeout.rate,
        tax_takein_subtotal: String(taxBreakdown.takein.subtotal),
        tax_takein_amount: String(taxBreakdown.takein.tax),
        tax_takein_total: String(taxBreakdown.takein.total),
        tax_takein_rate: taxBreakdown.takein.rate,
        tax_total_subtotal: String(taxBreakdown.totalSubtotal),
        tax_total_tax: String(taxBreakdown.totalTax),
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
