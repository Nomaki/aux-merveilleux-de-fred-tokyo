// Mock payment service that simulates backend behavior
// This detects Stripe test cards and returns appropriate errors

interface PaymentResult {
  success: boolean;
  error?: {
    message: string;
    code: string;
  };
  transactionId?: string;
}

// Stripe test card numbers that should fail
const STRIPE_TEST_CARDS: Record<string, { message: string; code: string }> = {
  '4000000000000002': {
    message: 'Your card was declined.',
    code: 'card_declined',
  },
  '4000000000009995': {
    message: 'Your card has insufficient funds.',
    code: 'insufficient_funds',
  },
  '4000000000009987': {
    message: 'Your card was declined. This card has been reported lost.',
    code: 'lost_card',
  },
  '4000000000009979': {
    message: 'Your card was declined. This card has been reported stolen.',
    code: 'stolen_card',
  },
  '4000000000000069': {
    message: 'Your card has expired.',
    code: 'expired_card',
  },
  '4000000000000127': {
    message: 'Your card\'s security code is incorrect.',
    code: 'incorrect_cvc',
  },
  '4000000000000119': {
    message: 'An error occurred while processing your card. Please try again.',
    code: 'processing_error',
  },
};

/**
 * Simulates backend payment processing
 * In production, this would be a real API call to your backend
 * which would create and confirm a Stripe PaymentIntent
 */
export async function processPayment(
  paymentMethodId: string,
  amount: number
): Promise<PaymentResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Extract card number from payment method ID for testing
  // In reality, the backend would use the payment method with Stripe API
  // and Stripe would return the appropriate error

  // For testing purposes, we check if the payment method contains test card info
  // This is a simplified simulation - in production, the backend handles this
  console.log('Processing payment...', { paymentMethodId, amount });

  // Simulate random processing errors (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred. Please try again.',
        code: 'processing_error',
      },
    };
  }

  // In a real implementation, Stripe would detect test cards automatically
  // Here we're just simulating successful payments
  // To properly test card errors, you would need a real backend that:
  // 1. Creates a PaymentIntent with the test amount
  // 2. Confirms the payment with the payment method
  // 3. Returns the result (success or error from Stripe)

  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Checks if a card number (last 4 digits or full number) is a known Stripe test card
 * This is used for client-side simulation only
 */
export function getTestCardError(cardNumber: string): { message: string; code: string } | null {
  // Remove spaces and get last 16 digits
  const cleaned = cardNumber.replace(/\s/g, '');

  // Check if it's a known error card
  if (STRIPE_TEST_CARDS[cleaned]) {
    return STRIPE_TEST_CARDS[cleaned];
  }

  return null;
}
