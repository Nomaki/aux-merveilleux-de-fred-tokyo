import { useState } from 'react';
import {
  Paper,
  Title,
  TextInput,
  Group,
  Button,
  Stack,
  Box,
  Radio,
  Card,
  Image,
  Text,
  Textarea,
  Grid,
  Alert,
  Checkbox,
  Modal,
  ScrollArea,
  Anchor,
  Badge,
  ActionIcon,
  Divider,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { CakeOrder, CartItem } from '../types';
import { IconCake, IconInfoCircle, IconPlus, IconMinus, IconTrash, IconShoppingCart } from '@tabler/icons-react';
import merveilleuxImg from '../assets/merveilleux.png';
import incroyableImg from '../assets/incroyable.png';
import plateImg from '../assets/plate.png';

export function ReservationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [merveilleuxSize, setMerveilleuxSize] = useState<'4-6' | '6-8'>('4-6');
  const [merveilleuxService, setMerveilleuxService] = useState<'takeout' | 'takein'>('takeout');
  const [incroyableSize, setIncroyableSize] = useState<'4-6' | '6-8'>('4-6');
  const [incroyableService, setIncroyableService] = useState<'takeout' | 'takein'>('takeout');

  const form = useForm<CakeOrder>({
    initialValues: {
      nameKanji: '',
      familyNameKanji: '',
      nameKatakana: '',
      familyNameKatakana: '',
      deliveryDateTime: null as any, // No default date - user must select
      cartItems: [],
      cakeText: '',
      phoneNumber: '',
      email: '',
      acceptTerms: false,
    },
    validate: {
      nameKanji: (value: string) => (value.length === 0 ? t('validation.required') : null),
      familyNameKanji: (value: string) => (value.length === 0 ? t('validation.required') : null),
      nameKatakana: (value: string) => (value.length === 0 ? t('validation.required') : null),
      familyNameKatakana: (value: string) => (value.length === 0 ? t('validation.required') : null),
      deliveryDateTime: (value: Date) => {
        if (!value) return t('validation.required');
        const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
        return value < minDate ? t('validation.minDate') : null;
      },
      phoneNumber: (value: string) => {
        const phoneRegex = /^[\d\-+\(\)\s]+$/;
        return !phoneRegex.test(value) ? t('validation.invalidPhone') : null;
      },
      email: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? t('validation.invalidEmail') : null;
      },
      cakeText: (value: string) => (value.length > 30 ? t('validation.maxTextLength') : null),
      acceptTerms: (value: boolean) => (!value ? t('validation.acceptTerms') : null),
    },
  });

  const addToCart = (cakeType: 'merveilleux' | 'incroyable' | 'plate', cakeSize?: '4-6' | '6-8', serviceType?: 'takeout' | 'takein') => {
    const price = getPrice(cakeType, cakeSize, serviceType);
    const newItem: CartItem = {
      id: Date.now().toString(),
      cakeType,
      cakeSize,
      serviceType,
      cakeText: form.values.cakeText,
      price,
      quantity: 1,
    };

    setCart((prev) => [...prev, newItem]);

    notifications.show({
      title: 'Added to cart',
      message: `${cakeType} added to your cart`,
      color: 'green',
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmit = async (values: CakeOrder) => {
    setIsSubmitting(true);
    try {
      const orderData: CakeOrder = {
        ...values,
        cartItems: cart,
      };

      // Store form data in localStorage for now
      localStorage.setItem('cakeOrder', JSON.stringify(orderData));

      notifications.show({
        title: t('common.confirm'),
        message: t('form.submitOrder'),
        color: 'green',
      });

      navigate('/confirmation');
    } catch {
      notifications.show({
        title: t('errors.networkError'),
        message: t('errors.tryAgain'),
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const getPrice = (cakeType: string, size?: string, serviceType?: string) => {
    if (cakeType === 'plate') return 2000;

    const basePrice = cakeType === 'merveilleux' ? 3500 : 3200; // incroyable base price
    const sizeMultiplier = size === '6-8' ? 1.4 : 1;
    const serviceAdjustment = serviceType === 'takein' ? 300 : 0;

    return Math.round(basePrice * sizeMultiplier + serviceAdjustment);
  };

  return (
    <Box py={{ base: 'xs', sm: 'xl' }}>
      <Paper shadow="sm" radius="md" px={{ base: 'md', xs: 'xl' }} py="xl">
        <Title order={1} mb="lg" ta="center" c="primary">
          <IconCake size={32} style={{ marginRight: 8 }} />
          {t('form.title')}
        </Title>

        <Alert icon={<IconInfoCircle size={16} />} mb="lg" color="blue">
          <Text size="sm">{t('validation.minDate')}</Text>
        </Alert>

        <form
          onSubmit={form.onSubmit((values) => {
            // Check if cart has items before submitting
            if (cart.length === 0) {
              notifications.show({
                title: t('cart.empty'),
                message: t('cart.emptyMessage'),
                color: 'red',
              });
              return;
            }
            handleSubmit(values as CakeOrder);
          })}
        >
          <Stack gap="lg">
            <Grid>
              <Grid.Col span={6}>
                <TextInput label={t('form.familyNameKanji')} placeholder="田中" required {...form.getInputProps('familyNameKanji')} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label={t('form.nameKanji')} placeholder="太郎" required {...form.getInputProps('nameKanji')} />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <TextInput label={t('form.familyNameKatakana')} placeholder="タナカ" required {...form.getInputProps('familyNameKatakana')} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label={t('form.nameKatakana')} placeholder="タロウ" required {...form.getInputProps('nameKatakana')} />
              </Grid.Col>
            </Grid>

            <DateTimePicker
              label={t('form.deliveryDateTime')}
              placeholder={t('form.deliveryDateTime')}
              required
              minDate={minDate}
              {...form.getInputProps('deliveryDateTime')}
            />

            <Box>
              <Text size="sm" fw={500} mb="xs">
                {t('cart.selectCakes')}
              </Text>
              <Stack gap="md">
                {/* Le Merveilleux */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Group align="flex-start">
                      <Image src={merveilleuxImg} alt="Le Merveilleux" w={90} h={80} radius="md" />
                      <Box>
                        <Text fw={500}>Le Merveilleux</Text>
                        <Text size="sm" c="dimmed">
                          リッチなチョコレートケーキ
                        </Text>
                        <Text size="md" fw={600} c="primary" mt={4}>
                          ¥{getPrice('merveilleux', merveilleuxSize, merveilleuxService).toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                  </Group>

                  <Grid mb="md">
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        {t('cart.size')}
                      </Text>
                      <Radio.Group value={merveilleuxSize} onChange={(value) => setMerveilleuxSize(value as '4-6' | '6-8')}>
                        <Stack gap="xs">
                          <Radio value="4-6" label={`4-6 ${t('cart.persons')}`} />
                          <Radio value="6-8" label={`6-8 ${t('cart.persons')}`} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        {t('cart.service')}
                      </Text>
                      <Radio.Group value={merveilleuxService} onChange={(value) => setMerveilleuxService(value as 'takeout' | 'takein')}>
                        <Stack gap="xs">
                          <Radio value="takeout" label={t('cart.takeout')} />
                          <Radio value="takein" label={t('cart.takein')} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                  </Grid>

                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => addToCart('merveilleux', merveilleuxSize, merveilleuxService)}
                    color="primary"
                    fullWidth
                  >
                    {t('cart.addToCart')}
                  </Button>
                </Card>

                {/* L'incroyable */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Group align="flex-start">
                      <Image src={incroyableImg} alt="L'incroyable" w={90} h={80} radius="md" />
                      <Box>
                        <Text fw={500}>L'incroyable</Text>
                        <Text size="sm" c="dimmed">
                          驚くべき美味しさのケーキ
                        </Text>
                        <Text size="md" fw={600} c="primary" mt={4}>
                          ¥{getPrice('incroyable', incroyableSize, incroyableService).toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                  </Group>

                  <Grid mb="md">
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        {t('cart.size')}
                      </Text>
                      <Radio.Group value={incroyableSize} onChange={(value) => setIncroyableSize(value as '4-6' | '6-8')}>
                        <Stack gap="xs">
                          <Radio value="4-6" label={`4-6 ${t('cart.persons')}`} />
                          <Radio value="6-8" label={`6-8 ${t('cart.persons')}`} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" fw={500} mb="xs">
                        {t('cart.service')}
                      </Text>
                      <Radio.Group value={incroyableService} onChange={(value) => setIncroyableService(value as 'takeout' | 'takein')}>
                        <Stack gap="xs">
                          <Radio value="takeout" label={t('cart.takeout')} />
                          <Radio value="takein" label={t('cart.takein')} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                  </Grid>

                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => addToCart('incroyable', incroyableSize, incroyableService)}
                    color="primary"
                    fullWidth
                  >
                    {t('cart.addToCart')}
                  </Button>
                </Card>

                {/* Birthday Plate */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Group align="flex-start">
                      <Image src={plateImg} alt="Birthday Plate" w={90} h={90} radius="md" />
                      <Box>
                        <Text fw={500}>Birthday Plate</Text>
                        <Text size="sm" c="dimmed">
                          特別なバースデープレート
                        </Text>
                        <Text size="md" fw={600} c="primary" mt={4}>
                          ¥{getPrice('plate').toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                  </Group>

                  <Button leftSection={<IconPlus size={16} />} onClick={() => addToCart('plate')} color="primary" fullWidth>
                    {t('cart.addToCart')}
                  </Button>
                </Card>
              </Stack>
            </Box>

            {/* Cart Display */}
            {cart.length > 0 && (
              <Box>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={500}>
                    <IconShoppingCart size={20} style={{ marginRight: 8 }} />
                    {t('cart.title')} ({cart.length} {cart.length === 1 ? t('cart.item') : t('cart.items')})
                  </Text>
                  <Text size="lg" fw={600} c="primary">
                    {t('cart.total')} ¥{getTotalPrice().toLocaleString()}
                  </Text>
                </Group>

                <Stack gap="sm">
                  {cart.map((item) => (
                    <Card key={item.id} shadow="sm" padding="md" radius="md" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <Box flex={1}>
                          <Text fw={500}>{item.cakeType}</Text>
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
                          <Text size="sm" fw={500} c="primary">
                            ¥{item.price.toLocaleString()} {t('cart.each')}
                          </Text>
                        </Box>

                        <Group gap="xs" align="center">
                          <ActionIcon variant="subtle" color="gray" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <IconMinus size={16} />
                          </ActionIcon>

                          <Badge variant="filled" size="lg">
                            {item.quantity}
                          </Badge>

                          <ActionIcon variant="subtle" color="blue" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <IconPlus size={16} />
                          </ActionIcon>

                          <ActionIcon variant="subtle" color="red" onClick={() => removeFromCart(item.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>

                <Divider my="md" />
              </Box>
            )}

            <Textarea
              label={t('form.cakeText')}
              placeholder={t('form.cakeTextPlaceholder')}
              description={t('form.cakeTextLimit')}
              maxLength={30}
              rows={3}
              {...form.getInputProps('cakeText')}
            />

            <TextInput label={t('form.phoneNumber')} placeholder="090-1234-5678" required {...form.getInputProps('phoneNumber')} />

            <TextInput label={t('form.email')} placeholder="example@email.com" type="email" required {...form.getInputProps('email')} />

            <Checkbox
              label={
                <Text size="sm">
                  {t('terms.agreeText')}{' '}
                  <Anchor
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {t('terms.title')}
                  </Anchor>
                </Text>
              }
              required
              {...form.getInputProps('acceptTerms', { type: 'checkbox' })}
            />

            <Group justify="center" mt="xl">
              <Button type="submit" size="lg" loading={isSubmitting} color="primary" disabled={cart.length === 0}>
                {cart.length === 0 ? t('cart.addItemsFirst') : t('form.submitOrder')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>

      <Modal opened={termsModalOpen} onClose={() => setTermsModalOpen(false)} title={t('terms.title')} size="lg" centered>
        <ScrollArea h={400}>
          <Stack gap="md">
            <Title order={3}>{t('terms.mainTitle')}</Title>

            <Text size="sm" fw={500}>
              1. Reservation Policy
            </Text>
            <Text size="sm">
              • All cake orders must be placed at least 48 hours in advance. • Reservations are confirmed only after payment completion. • Custom cake
              text is limited to 25 characters.
            </Text>

            <Text size="sm" fw={500}>
              2. Payment Terms
            </Text>
            <Text size="sm">
              • Full payment is required at the time of reservation. • We accept major credit cards and digital payments. • Refunds are available up
              to 24 hours before the delivery date.
            </Text>

            <Text size="sm" fw={500}>
              3. Delivery Information
            </Text>
            <Text size="sm">
              • Delivery is available within designated areas. • Delivery times are estimates and may vary due to traffic conditions. • Someone must
              be available to receive the cake at the specified time.
            </Text>

            <Text size="sm" fw={500}>
              4. Cake Quality
            </Text>
            <Text size="sm">
              • All cakes are made fresh with high-quality ingredients. • Please inform us of any allergies or dietary restrictions. • Cakes should be
              consumed within 2 days of delivery for best quality.
            </Text>

            <Text size="sm" fw={500}>
              5. Cancellation Policy
            </Text>
            <Text size="sm">
              • Cancellations made 24+ hours before delivery: Full refund • Cancellations made 12-24 hours before delivery: 50% refund • Cancellations
              made less than 12 hours before delivery: No refund
            </Text>

            <Text size="sm" fw={500}>
              6. Contact Information
            </Text>
            <Text size="sm">
              For any questions or concerns, please contact us at:
              <br />
              Email: support@birthdaycakes.com
              <br />
              Phone: 090-1234-5678
            </Text>
          </Stack>
        </ScrollArea>

        <Group justify="center" mt="md">
          <Button onClick={() => setTermsModalOpen(false)} variant="outline">
            {t('terms.close')}
          </Button>
          <Button
            onClick={() => {
              form.setFieldValue('acceptTerms', true);
              setTermsModalOpen(false);
            }}
          >
            {t('terms.accept')}
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}
