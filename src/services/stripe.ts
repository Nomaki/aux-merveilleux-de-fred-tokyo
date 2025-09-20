// This is a mock Stripe service for demonstration
// In production, you would use your actual Stripe publishable key

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_publishable_key_here';

export const createPaymentIntent = async (_amount: number = 5000) => {
  // Mock API call - in production, this would be a call to your backend
  return new Promise<{ clientSecret: string; paymentIntentId: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        clientSecret: `pi_mock_${Date.now()}_secret_mock`,
        paymentIntentId: `pi_mock_${Date.now()}`,
      });
    }, 1000);
  });
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