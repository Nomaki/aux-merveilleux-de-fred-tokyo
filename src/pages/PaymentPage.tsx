import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Box,
  Button,
  Group,
  Stack,
  Card,
  Radio,
  Alert,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { CakeOrder, CartItem } from '../types';
import { IconCreditCard, IconBrandPaypal, IconAlertCircle, IconLock } from '@tabler/icons-react';
import { processPayPay, getStripe, createPaymentIntent } from '../services/stripe';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '../components/StripePaymentForm';

type PaymentMethod = 'card' | 'paypay';

export function PaymentPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<CakeOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

      // Create PaymentIntent when order data is loaded
      const amount = order.cartItems.reduce(
        (total: number, item: CartItem) => total + (item.price * item.quantity),
        0
      );

      createPaymentIntent(amount, order)
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
    if (!orderData) return;

    const reservationCode = generateReservationCode();
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

  const handlePayPayPayment = async () => {
    if (!orderData) return;

    setIsProcessing(true);
    try {
      const result = await processPayPay(orderData);

      if (result.success) {
        handlePaymentSuccess();
      }
    } catch (error) {
      notifications.show({
        title: t('errors.paymentFailed'),
        message: t('errors.tryAgain'),
        color: 'red',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReservationCode = () => {
    return 'CAKE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
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

          <Box>
            <Text size="lg" fw={500} mb="md">
              {t('payment.selectMethod')}
            </Text>
            <Radio.Group
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <Stack gap="md">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <Group>
                      <IconCreditCard size={24} />
                      <Box>
                        <Text fw={500}>{t('payment.creditCard')}</Text>
                        <Text size="sm" c="dimmed">
                          Visa, MasterCard, American Express
                        </Text>
                      </Box>
                    </Group>
                    <Radio value="card" />
                  </Group>
                </Card>

                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between">
                    <Group>
                      <IconBrandPaypal size={24} />
                      <Box>
                        <Text fw={500}>{t('payment.paypay')}</Text>
                        <Text size="sm" c="dimmed">
                          PayPay簡単決済
                        </Text>
                      </Box>
                    </Group>
                    <Radio value="paypay" />
                  </Group>
                </Card>
              </Stack>
            </Radio.Group>
          </Box>

          <Divider />

          {paymentMethod === 'card' ? (
            clientSecret ? (
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
            )
          ) : (
            <Group justify="center" gap="md" mt="xl">
              <Button
                variant="outline"
                size="lg"
                onClick={goBack}
                disabled={isProcessing}
              >
                {t('common.back')}
              </Button>
              <Button
                size="lg"
                color="primary"
                onClick={handlePayPayPayment}
                loading={isProcessing}
              >
                {isProcessing
                  ? t('payment.processing')
                  : `${price}を支払う`
                }
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}