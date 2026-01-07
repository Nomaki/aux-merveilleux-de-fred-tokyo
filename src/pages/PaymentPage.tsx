import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Box,
  Group,
  Stack,
  Card,
  Alert,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { CakeOrder, CartItem } from '../types';
import { IconAlertCircle, IconLock } from '@tabler/icons-react';
import { getStripe, createPaymentIntent } from '../services/stripe';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { generateReservationCode } from '../lib/reservationCode';

export function PaymentPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<CakeOrder | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string>('');
  const stripePromise = getStripe();

  useEffect(() => {
    const storedOrder = localStorage.getItem('cakeOrder');
    if (!storedOrder) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'No order data found. Please fill the form again.',
        color: 'red',
      });
      navigate('/');
      return;
    }

    try {
      const order = JSON.parse(storedOrder);
      order.deliveryDateTime = new Date(order.deliveryDateTime);
      setOrderData(order);

      // Generate reservation code before payment
      const newReservationCode = generateReservationCode();
      setReservationCode(newReservationCode);

      // Add reservation code to order data for Stripe metadata
      const orderWithReservation = {
        ...order,
        reservationCode: newReservationCode,
      };

      // Create PaymentIntent when order data is loaded
      const amount = order.cartItems.reduce(
        (total: number, item: CartItem) => total + (item.price * item.quantity),
        0
      );

      createPaymentIntent(amount, orderWithReservation, i18n.language)
        .then((result) => {
          setClientSecret(result.clientSecret);
        })
        .catch((error) => {
          notifications.show({
            title: t('errors.networkError'),
            message: 'Failed to initialize payment. Please try again.',
            color: 'red',
          });
          console.error('Failed to create payment intent:', error);
        });
    } catch (error) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'Invalid order data. Please fill the form again.',
        color: 'red',
      });
      navigate('/');
    }
  }, [navigate, t]);

  const handlePaymentSuccess = () => {
    if (!orderData || !reservationCode) return;

    const confirmation = {
      reservationCode,
      order: orderData,
      paymentStatus: 'completed' as const,
      createdAt: new Date(),
    };

    localStorage.setItem('reservationConfirmation', JSON.stringify(confirmation));

    notifications.show({
      title: t('payment.complete'),
      message: t('success.title'),
      color: 'green',
    });

    navigate('/success');
  };

  const goBack = () => {
    navigate('/confirmation');
  };

  if (!orderData) {
    return (
      <Box py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Center>
            <Loader />
          </Center>
        </Paper>
      </Box>
    );
  }

  const getTotalPrice = () => {
    return orderData.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const price = `¥${getTotalPrice().toLocaleString()}`;

  return (
    <Box py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Title order={1} mb="lg" ta="center" c="primary">
          <IconLock size={32} style={{ marginRight: 8 }} />
          {t('payment.title')}
        </Title>

        <Alert icon={<IconAlertCircle size={16} />} mb="lg" color="blue">
          <Text size="sm">
            {i18n.language === 'ja'
              ? 'すべての決済は安全に暗号化されています。'
              : 'All payments are securely encrypted.'
            }
          </Text>
        </Alert>

        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>
                {orderData.cartItems?.length > 0
                  ? `${orderData.cartItems.length} item(s)`
                  : 'No items'
                }
              </Text>
              <Text fw={700} size="xl" c="primary">
                {price}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">
              {orderData.familyNameKanji} {orderData.nameKanji} 様
            </Text>
          </Card>

          <Divider />

          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <StripePaymentForm
                amount={getTotalPrice()}
                onSuccess={handlePaymentSuccess}
                onBack={goBack}
              />
            </Elements>
          ) : (
            <Center py="xl">
              <Loader />
            </Center>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}