import { useState, useEffect } from 'react';
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
  Loader,
  Select,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import type { CakeOrder, CartItem } from '../types';
import { IconCake, IconInfoCircle, IconPlus, IconMinus, IconTrash, IconShoppingCart, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { useOrderCapacity } from '../hooks/useOrderCapacity';
import { useCalendarCapacity } from '../hooks/useCalendarCapacity';
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
  const [merveilleuxText, setMerveilleuxText] = useState('');
  const [incroyableSize, setIncroyableSize] = useState<'4-6' | '6-8'>('4-6');
  const [incroyableService, setIncroyableService] = useState<'takeout' | 'takein'>('takeout');
  const [incroyableText, setIncroyableText] = useState('');
  const [plateText, setPlateText] = useState('');
  const [animatingItemId, setAnimatingItemId] = useState<string | null>(null);

  // Order capacity checking
  const { capacity, isLoading: isCheckingCapacity, checkCapacity } = useOrderCapacity();
  const { getCapacityForDate, checkMonthCapacity } = useCalendarCapacity();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const form = useForm<CakeOrder>({
    initialValues: {
      nameKanji: '',
      familyNameKanji: '',
      nameKatakana: '',
      familyNameKatakana: '',
      deliveryDateTime: null as any, // No default date - user must select
      cartItems: [],
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
        if (value < minDate) return t('validation.minDate');

        // Check if date is fully booked
        if (capacity && !capacity.available) {
          return t('validation.dateFull');
        }

        return null;
      },
      phoneNumber: (value: string) => {
        const phoneRegex = /^[\d\-+\(\)\s]+$/;
        return !phoneRegex.test(value) ? t('validation.invalidPhone') : null;
      },
      email: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? t('validation.invalidEmail') : null;
      },
      acceptTerms: (value: boolean) => (!value ? t('validation.acceptTerms') : null),
    },
  });

  // Check capacity when delivery date changes
  useEffect(() => {
    if (form.values.deliveryDateTime) {
      console.log('🔍 Checking capacity for date:', form.values.deliveryDateTime);
      console.log('📊 Current capacity state:', { isCheckingCapacity, capacity });
      checkCapacity(form.values.deliveryDateTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.deliveryDateTime]);

  // Debug logging for capacity changes
  useEffect(() => {
    if (capacity) {
      console.log('✅ Capacity updated:', capacity);
    }
  }, [capacity]);

  // Track the current visible month in the calendar
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Load capacity data for the current month when component mounts
  useEffect(() => {
    if (!hasLoadedInitial) {
      const currentMonth = new Date();
      console.log('📅 Loading capacity for current month (initial)');
      checkMonthCapacity(currentMonth);
      setHasLoadedInitial(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load capacity data when visible month changes (but not on initial mount)
  useEffect(() => {
    if (hasLoadedInitial) {
      console.log('📅 Loading capacity for month:', visibleMonth);
      checkMonthCapacity(visibleMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth, hasLoadedInitial]);

  const addToCart = (cakeType: 'merveilleux' | 'incroyable' | 'plate', cakeSize?: '4-6' | '6-8', serviceType?: 'takeout' | 'takein') => {
    const price = getPrice(cakeType, cakeSize, serviceType);

    // Get the appropriate message based on cake type
    let cakeText = '';
    if (cakeType === 'merveilleux') {
      cakeText = merveilleuxText;
    } else if (cakeType === 'incroyable') {
      cakeText = incroyableText;
    } else if (cakeType === 'plate') {
      cakeText = plateText;
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      cakeType,
      cakeSize,
      serviceType,
      cakeText,
      price,
      quantity: 1,
    };

    setCart((prev) => [...prev, newItem]);

    // Trigger animation for the new item
    setAnimatingItemId(newItem.id);
    setTimeout(() => setAnimatingItemId(null), 500);

    // Clear the message field after adding to cart
    if (cakeType === 'merveilleux') {
      setMerveilleuxText('');
    } else if (cakeType === 'incroyable') {
      setIncroyableText('');
    } else if (cakeType === 'plate') {
      setPlateText('');
    }

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

  // Custom day renderer for calendar with capacity indicators
  const renderDay = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const capacity = getCapacityForDate(dateObj);
    const day = dateObj.getDate();

    // Debug logging for first few renders
    if (day <= 3) {
      console.log(`🎨 Rendering day ${day}:`, {
        date: dateObj.toISOString().split('T')[0],
        hasCapacity: !!capacity,
        capacity,
        beforeMinDate: dateObj < minDate,
      });
    }

    // Don't show indicators for dates before minDate
    if (dateObj < minDate) {
      return <div style={{ padding: '4px' }}>{day}</div>;
    }

    if (!capacity) {
      return <div style={{ padding: '4px' }}>{day}</div>;
    }

    let symbol = '';
    let color = '';

    if (!capacity.available) {
      // Full - Red x
      symbol = 'x';
      color = '#fa5252';
    } else if (capacity.remaining <= 5) {
      // Limited - Orange triangle (▲)
      symbol = '▲';
      color = '#fd7e14';
    } else {
      // Available - Green circle (●)
      symbol = '●';
      color = '#40c057';
    }

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
        }}
      >
        <div>{day}</div>
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: color,
            lineHeight: '1',
          }}
        >
          {symbol}
        </div>
      </div>
    );
  };

  const getPrice = (cakeType: string, size?: string, serviceType?: string) => {
    if (cakeType === 'plate') return 500;

    // Base prices for takeout (Merveilleux and Incroyable have the same prices)
    const basePrices = {
      '4-6': 4150,
      '6-8': 5800,
    };

    const basePrice = basePrices[size as '4-6' | '6-8'] || basePrices['4-6'];

    // Take-in adjustment varies by size
    let serviceAdjustment = 0;
    if (serviceType === 'takein') {
      if (cakeType === 'merveilleux' || cakeType === 'incroyable') {
        serviceAdjustment = size === '4-6' ? 350 : 300; // 350 for 4-6, 300 for 6-8
      }
    }

    return basePrice + serviceAdjustment;
  };

  return (
    <Box py={{ base: 'xs', sm: 'xl' }}>
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
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

            <Box>
              <DatePickerInput
                label={t('form.deliveryDateTime')}
                placeholder={t('form.deliveryDateTime')}
                required
                minDate={minDate}
                renderDay={renderDay}
                value={selectedDate}
                onChange={(value) => {
                  const dateValue = typeof value === 'string' ? new Date(value) : value;
                  setSelectedDate(dateValue);
                  // Update deliveryDateTime when both date and time are selected
                  if (dateValue && selectedTime) {
                    const [hours, minutes] = selectedTime.split(':');
                    const dateTime = new Date(dateValue);
                    dateTime.setHours(parseInt(hours), parseInt(minutes));
                    form.setFieldValue('deliveryDateTime', dateTime);
                  } else if (!dateValue || !selectedTime) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    form.setFieldValue('deliveryDateTime', null as any);
                  }
                }}
                onMonthSelect={(month) => {
                  console.log('📅 Month selected:', month);
                  const monthDate = typeof month === 'string' ? new Date(month) : month;
                  setVisibleMonth(monthDate);
                }}
                error={form.errors.deliveryDateTime}
              />

              <Select
                label={t('form.deliveryTime')}
                placeholder={t('form.selectTime')}
                data={[
                  { value: '09:00', label: '09:00' },
                  { value: '09:30', label: '09:30' },
                  { value: '10:00', label: '10:00' },
                  { value: '10:30', label: '10:30' },
                  { value: '11:00', label: '11:00' },
                  { value: '11:30', label: '11:30' },
                  { value: '12:00', label: '12:00' },
                  { value: '12:30', label: '12:30' },
                  { value: '13:00', label: '13:00' },
                  { value: '13:30', label: '13:30' },
                  { value: '14:00', label: '14:00' },
                  { value: '14:30', label: '14:30' },
                  { value: '15:00', label: '15:00' },
                  { value: '15:30', label: '15:30' },
                  { value: '16:00', label: '16:00' },
                  { value: '16:30', label: '16:30' },
                  { value: '17:00', label: '17:00' },
                  { value: '17:30', label: '17:30' },
                  { value: '18:00', label: '18:00' },
                ]}
                value={selectedTime}
                onChange={(value) => {
                  setSelectedTime(value);
                  // Update deliveryDateTime when both date and time are selected
                  if (selectedDate && value) {
                    const [hours, minutes] = value.split(':');
                    const dateTime = new Date(selectedDate);
                    dateTime.setHours(parseInt(hours), parseInt(minutes));
                    form.setFieldValue('deliveryDateTime', dateTime);
                  } else if (!selectedDate || !value) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    form.setFieldValue('deliveryDateTime', null as any);
                  }
                }}
                mt="xs"
                required
                clearable
              />

              {/* Capacity Status Display */}
              {form.values.deliveryDateTime && (
                <Box mt="xs">
                  {isCheckingCapacity ? (
                    <Group gap="xs">
                      <Loader size="xs" />
                      <Text size="sm" c="dimmed">
                        {t('form.capacityChecking')}
                      </Text>
                    </Group>
                  ) : capacity ? (
                    <>
                      {!capacity.available ? (
                        <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                          <Text size="sm" fw={500}>
                            {t('form.capacityFull')}
                          </Text>
                        </Alert>
                      ) : capacity.remaining <= 5 ? (
                        <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
                          <Text size="sm">{t('form.capacityLimited', { count: capacity.remaining })}</Text>
                        </Alert>
                      ) : (
                        <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
                          <Text size="sm">{t('form.capacityAvailable')}</Text>
                        </Alert>
                      )}
                    </>
                  ) : null}
                </Box>
              )}
            </Box>

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
                          <Radio value="takein" label={t(merveilleuxSize === '4-6' ? 'cart.takein4to6' : 'cart.takein6to8')} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                  </Grid>

                  <Textarea
                    label={t('form.cakeText')}
                    placeholder={t('form.cakeTextPlaceholder')}
                    description={t('form.cakeTextLimit')}
                    maxLength={30}
                    rows={2}
                    value={merveilleuxText}
                    onChange={(event) => setMerveilleuxText(event.currentTarget.value)}
                    mb="md"
                  />

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
                          <Radio value="takein" label={t(incroyableSize === '4-6' ? 'cart.takein4to6' : 'cart.takein6to8')} />
                        </Stack>
                      </Radio.Group>
                    </Grid.Col>
                  </Grid>

                  <Textarea
                    label={t('form.cakeText')}
                    placeholder={t('form.cakeTextPlaceholder')}
                    description={t('form.cakeTextLimit')}
                    maxLength={30}
                    rows={2}
                    value={incroyableText}
                    onChange={(event) => setIncroyableText(event.currentTarget.value)}
                    mb="md"
                  />

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

                  <Textarea
                    label={t('form.cakeText')}
                    placeholder={t('form.cakeTextPlaceholder')}
                    description={t('form.cakeTextLimit')}
                    maxLength={30}
                    rows={2}
                    value={plateText}
                    onChange={(event) => setPlateText(event.currentTarget.value)}
                    mb="md"
                  />

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
                    <Card
                      key={item.id}
                      shadow="sm"
                      padding="md"
                      radius="md"
                      withBorder
                      style={{
                        animation: animatingItemId === item.id ? 'slideIn 0.5s ease-out' : undefined,
                      }}
                    >
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

            <Text size="sm" fw={500} c="dimmed">
              {t('terms.intro')}
            </Text>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.cancellation.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.cancellation.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.email.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.email.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.plateOnly.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.plateOnly.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.arrival.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.arrival.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.seating.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.seating.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.takeaway.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.takeaway.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.additional.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.additional.content')}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={600} mb="xs">
                {t('terms.changes.title')}
              </Text>
              <Text size="sm" c="dimmed">
                {t('terms.changes.content')}
              </Text>
            </Box>
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
