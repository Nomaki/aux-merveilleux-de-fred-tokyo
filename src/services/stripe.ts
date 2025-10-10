import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Create Payment Intent by calling our backend API
export const createPaymentIntent = async (
  amount: number,
  orderData?: any
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        orderData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    const data = await response.json();
    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(error.message || 'Failed to create payment intent');
  }
};

export const processPayPay = async (_orderData: any) => {
  // Mock PayPay processing - in production, this would integrate with PayPay API
  return new Promise<{ success: boolean; transactionId: string }>((resolve, reject) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          transactionId: `paypay_${Date.now()}`,
        });
      } else {
        reject(new Error('Payment failed'));
      }
    }, 2000);
  });
};