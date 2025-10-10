import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button, Alert, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconAlertCircle } from '@tabler/icons-react';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
}

export function StripePaymentForm({ amount, onSuccess, onBack }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not properly initialized. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the payment using Stripe's confirmPayment
      // This will handle 3D Secure, card validation, and payment confirmation
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required', // Only redirect if 3D Secure is needed
      });

      if (confirmError) {
        // Payment failed - show error to user
        console.error('Payment confirmation error:', confirmError);
        setError(confirmError.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return; // STOP HERE - don't confirm order if payment failed
      }

      // Payment was successful!
      console.log('Payment confirmed successfully');

      // Only call onSuccess if payment was confirmed
      onSuccess();

    } catch (err: any) {
      console.error('Unexpected payment error:', err);
      setError(err.message || 'An unexpected error occurred during payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" mt="md">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <Alert icon={<IconAlertCircle size={16} />} color="blue" mt="md">
        <Text size="sm" fw={500} mb="xs">
          Mode Test - Cartes Stripe de test :
        </Text>
        <Text size="xs">
          ✓ Succès : 4242 4242 4242 4242<br />
          ✗ Refusée : 4000 0000 0000 0002<br />
          ✗ Fonds insuffisants : 4000 0000 0000 9995<br />
          ✗ Carte perdue : 4000 0000 0000 9987<br />
          <Text size="xs" c="dimmed" mt="xs">
            Les erreurs de carte sont maintenant détectées par le backend !
          </Text>
        </Text>
      </Alert>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isProcessing}
          type="button"
        >
          {t('common.back')}
        </Button>
        <Button
          size="lg"
          type="submit"
          disabled={!stripe || isProcessing}
          loading={isProcessing}
        >
          {isProcessing
            ? t('payment.processing')
            : `¥${amount.toLocaleString()}を支払う`
          }
        </Button>
      </div>
    </form>
  );
}
