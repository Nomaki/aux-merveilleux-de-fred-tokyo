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
  orderData?: any,
  language?: string
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
        language: language || 'ja',
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create payment intent';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        // If response body is not JSON or empty, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
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

// Process PayPay payment through Stripe
export const processPayPay = async (
  amount: number,
  orderData?: any,
  language?: string
): Promise<{ success: boolean; paymentIntentId: string }> => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        orderData,
        language: language || 'ja',
        paymentMethod: 'paypay',
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create PayPay payment';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error: any) {
    console.error('Error processing PayPay payment:', error);
    throw new Error(error.message || 'Failed to process PayPay payment');
  }
};