import { useState, useEffect } from 'react';
import { Paper, Title, Text, Box, Button, Group, Stack, Card, Alert, Center, Divider, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { ReservationConfirmation, CartItem } from '../types';
import { IconCheck, IconCalendar, IconMail, IconCopy, IconHome, IconConfetti } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function SuccessPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState<ReservationConfirmation | null>(null);

  useEffect(() => {
    const storedConfirmation = localStorage.getItem('reservationConfirmation');
    if (!storedConfirmation) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'No confirmation data found.',
        color: 'red',
      });
      navigate('/');
      return;
    }

    try {
      const confirmationData = JSON.parse(storedConfirmation);
      confirmationData.order.deliveryDateTime = new Date(confirmationData.order.deliveryDateTime);
      confirmationData.createdAt = new Date(confirmationData.createdAt);
      setConfirmation(confirmationData);
    } catch (error) {
      notifications.show({
        title: t('errors.networkError'),
        message: 'Invalid confirmation data.',
        color: 'red',
      });
      navigate('/');
    }
  }, [navigate, t]);

  const formatDateTime = (date: Date) => {
    return format(date, 'PPPp', {
      locale: i18n.language === 'ja' ? ja : undefined,
    });
  };

  const handleNewOrder = () => {
    // Clear stored data
    localStorage.removeItem('cakeOrder');
    localStorage.removeItem('reservationConfirmation');
    navigate('/');
  };

  if (!confirmation) {
    return (
      <Box py="xl">
        <Paper shadow="sm" p="xl" radius="md">
          <Center>
            <Text>{t('loading')}</Text>
          </Center>
        </Paper>
      </Box>
    );
  }

  const getTotalPrice = () => {
    return confirmation.order.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCakeDisplayName = (cakeType: string) => {
    switch (cakeType) {
      case 'merveilleux':
        return 'Le Merveilleux';
      case 'incroyable':
        return "L'incroyable";
      case 'plate':
        return 'Birthday Plate';
      default:
        return cakeType;
    }
  };

  return (
    <Box py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Center mb="lg">
          <IconConfetti size={48} color="var(--mantine-color-yellow-6)" />
        </Center>

        <Title order={1} mb="lg" ta="center" c="primary">
          <IconCheck size={32} style={{ marginRight: 8 }} />
          {t('success.title')}
        </Title>

        <Alert color="green" variant="light" mb="lg">
          <Text size="sm" ta="center">
            {i18n.language === 'ja'
              ? 'ご注文ありがとうございました！バースデーケーキのご予約が正常に完了いたしました。'
              : 'Thank you for your order! Your birthday cake reservation has been successfully completed.'}
          </Text>
        </Alert>

        <Stack gap="lg">
          <Card shadow="sm" padding="lg" radius="md" withBorder bg="var(--mantine-color-green-0)">
            <Group justify="space-between" align="flex-start" mb="md">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  {t('success.reservationCode')}
                </Text>
                <Text fw={700} size="xl" ff="monospace" c="primary">
                  {confirmation.reservationCode}
                </Text>
              </Box>
              <CopyButton value={confirmation.reservationCode} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy reservation code'} withArrow>
                    <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>

            <Alert color="yellow" variant="light">
              <Text size="sm">
                <IconCalendar size={16} style={{ marginRight: 4 }} />
                {t('success.saveCode')}
              </Text>
            </Alert>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md" c="primary">
              {t('confirmation.orderDetails')}
            </Title>

            <Stack gap="md">
              {confirmation.order.cartItems.map((item: CartItem) => (
                <Card key={item.id} shadow="xs" padding="sm" radius="md" withBorder>
                  <Stack gap="xs">
                    <Text fw={500} size="sm">
                      {getCakeDisplayName(item.cakeType)}
                    </Text>
                    {item.cakeSize && (
                      <Text size="xs" c="dimmed">
                        {t('cart.size')}: {item.cakeSize} {t('cart.persons')}
                      </Text>
                    )}
                    {item.serviceType && (
                      <Text size="xs" c="dimmed">
                        {t('cart.service')}: {item.serviceType}
                      </Text>
                    )}
                    {item.cakeText && (
                      <Text size="xs" c="dimmed">
                        {t('cart.text')}: "{item.cakeText}"
                      </Text>
                    )}
                    <Text size="xs" fw={500} c="primary">
                      ¥{item.price.toLocaleString()} × {item.quantity} = ¥{(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </Stack>
                </Card>
              ))}

              <Divider />

              <Group justify="space-between">
                <Text fw={500}>{t('cart.total')}</Text>
                <Text fw={600} c="primary" size="lg">
                  ¥{getTotalPrice().toLocaleString()}
                </Text>
              </Group>

              <Divider />

              <Group align="flex-start">
                <Text size="sm" c="dimmed" style={{ minWidth: 120 }}>
                  {t('success.deliveryTime')}:
                </Text>
                <Text fw={500}>{formatDateTime(confirmation.order.deliveryDateTime)}</Text>
              </Group>

              <Group>
                <Text size="sm" c="dimmed" style={{ minWidth: 120 }}>
                  {t('form.email')}:
                </Text>
                <Text fw={500}>{confirmation.order.email}</Text>
              </Group>
            </Stack>
          </Card>

          <Divider />

          <Center>
            <Button leftSection={<IconHome size={16} />} size="lg" variant="outline" onClick={handleNewOrder}>
              {i18n.language === 'ja' ? '新しい注文' : 'New Order'}
            </Button>
          </Center>

          <Card shadow="sm" padding="md" radius="md" withBorder bg="var(--mantine-color-gray-0)">
            <Text size="xs" c="dimmed" ta="center">
              {i18n.language === 'ja'
                ? 'ご不明な点がございましたら、予約番号をお控えの上お問い合わせください。'
                : 'If you have any questions, please contact us with your reservation code.'}
            </Text>
          </Card>
        </Stack>
      </Paper>
    </Box>
  );
}
