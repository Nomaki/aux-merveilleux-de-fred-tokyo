import { useEffect, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Box,
  Button,
  Group,
  Stack,
  Card,
  Grid,
  Divider,
  Image,
  Alert,
} from '@mantine/core';
import merveilleuxImg from '../assets/merveilleux.png';
import incroyableImg from '../assets/incroyable.png';
import plateImg from '../assets/plate.png';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { CakeOrder, CartItem } from '../types';
import { IconEdit, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function ConfirmationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<CakeOrder | null>(null);

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
    } catch (error) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'Invalid order data. Please fill the form again.',
        color: 'red',
      });
      navigate('/');
    }
  }, [navigate, t]);

  const handleEdit = () => {
    navigate('/');
  };

  const handleProceedToPayment = () => {
    navigate('/payment');
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'PPPp', {
      locale: i18n.language === 'ja' ? ja : undefined,
    });
  };

  if (!orderData) {
    return (
      <Box py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Text ta="center">{t('loading')}</Text>
        </Paper>
      </Box>
    );
  }

  const getTotalPrice = () => {
    return orderData.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCakeImage = (cakeType: string) => {
    switch (cakeType) {
      case 'merveilleux':
        return merveilleuxImg;
      case 'incroyable':
        return incroyableImg;
      case 'plate':
        return plateImg;
      default:
        return merveilleuxImg;
    }
  };

  const getCakeDisplayName = (cakeType: string) => {
    switch (cakeType) {
      case 'merveilleux':
        return 'Le Merveilleux';
      case 'incroyable':
        return 'L\'incroyable';
      case 'plate':
        return 'Birthday Plate';
      default:
        return cakeType;
    }
  };

  return (
    <Box py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Title order={1} mb="lg" ta="center" c="primary">
          <IconCheck size={32} style={{ marginRight: 8 }} />
          {t('confirmation.title')}
        </Title>

        <Alert icon={<IconAlertCircle size={16} />} mb="lg" color="orange">
          <Text size="sm">
            {i18n.language === 'ja' 
              ? 'ご注文内容をご確認ください。間違いがある場合は「編集」ボタンを押して修正してください。'
              : 'Please review your order details. If there are any mistakes, click the "Edit" button to make corrections.'
            }
          </Text>
        </Alert>

        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md" c="primary">
              {t('confirmation.customerInfo')}
            </Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.familyNameKanji')}</Text>
                <Text fw={500}>{orderData.familyNameKanji}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.nameKanji')}</Text>
                <Text fw={500}>{orderData.nameKanji}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.familyNameKatakana')}</Text>
                <Text fw={500}>{orderData.familyNameKatakana}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.nameKatakana')}</Text>
                <Text fw={500}>{orderData.nameKatakana}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.phoneNumber')}</Text>
                <Text fw={500}>{orderData.phoneNumber}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">{t('form.email')}</Text>
                <Text fw={500}>{orderData.email}</Text>
              </Grid.Col>
            </Grid>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md" c="primary">
              {t('confirmation.orderDetails')}
            </Title>

            <Stack gap="md" mb="lg">
              {orderData.cartItems.map((item: CartItem) => (
                <Card key={item.id} shadow="xs" padding="md" radius="md" withBorder>
                  <Group align="flex-start" justify="space-between">
                    <Group align="flex-start">
                      <Image
                        src={getCakeImage(item.cakeType)}
                        alt={getCakeDisplayName(item.cakeType)}
                        w={80}
                        h={80}
                        radius="md"
                      />
                      <Box>
                        <Text fw={500} size="md" mb="xs">
                          {getCakeDisplayName(item.cakeType)}
                        </Text>
                        {item.cakeSize && (
                          <Text size="sm" c="dimmed">
                            {t('cart.size')}: {item.cakeSize} {t('cart.persons')}
                          </Text>
                        )}
                        {item.serviceType && (
                          <Text size="sm" c="dimmed">
                            {t('cart.service')}: {item.serviceType}
                          </Text>
                        )}
                        {item.cakeText && (
                          <Text size="sm" c="dimmed">
                            {t('cart.text')}: "{item.cakeText}"
                          </Text>
                        )}
                        <Text size="sm" fw={500} c="primary" mt="xs">
                          ¥{item.price.toLocaleString()} × {item.quantity} = ¥{(item.price * item.quantity).toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>

            <Divider mb="md" />

            <Group justify="space-between" mb="md">
              <Text size="lg" fw={500}>{t('cart.total')}</Text>
              <Text size="xl" fw={600} c="primary">
                ¥{getTotalPrice().toLocaleString()}
              </Text>
            </Group>

            <Group>
              <Text size="sm" c="dimmed">{t('form.deliveryDateTime')}</Text>
              <Text fw={500} size="lg">
                {formatDateTime(orderData.deliveryDateTime)}
              </Text>
            </Group>
          </Card>

          <Group justify="center" gap="md" mt="xl">
            <Button
              leftSection={<IconEdit size={16} />}
              variant="outline"
              size="lg"
              onClick={handleEdit}
            >
              {t('common.edit')}
            </Button>
            <Button
              size="lg"
              color="primary"
              onClick={handleProceedToPayment}
            >
              {t('confirmation.proceedToPayment')}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
}