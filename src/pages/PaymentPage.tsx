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
import { createPaymentIntent, processPayPay } from '../services/stripe';

type PaymentMethod = 'card' | 'paypay';

export function PaymentPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<CakeOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    paymentIntentId: string;
  } | null>(null);

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
      
      // Calculate total from cart items
      const total = order.cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);

      // Create payment intent for card payments
      createPaymentIntent(total).then(setPaymentIntent);
    } catch (error) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'Invalid order data. Please fill the form again.',
        color: 'red',
      });
      navigate('/');
    }
  }, [navigate, t]);

  const handleCardPayment = async () => {
    if (!paymentIntent || !orderData) return;

    setIsProcessing(true);
    try {
      // Mock card payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate 95% success rate
      if (Math.random() > 0.05) {
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
      } else {
        throw new Error('Payment failed');
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

  const handlePayPayPayment = async () => {
    if (!orderData) return;

    setIsProcessing(true);
    try {
      const result = await processPayPay(orderData);
      
      if (result.success) {
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

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else {
      handlePayPayPayment();
    }
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

          {paymentMethod === 'card' && !paymentIntent && (
            <Center>
              <Loader />
            </Center>
          )}

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
              onClick={handlePayment}
              loading={isProcessing}
              disabled={!paymentIntent && paymentMethod === 'card'}
            >
              {isProcessing 
                ? t('payment.processing')
                : `${price}を支払う`
              }
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
}