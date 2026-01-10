import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Paper, Title, Group, Button, Loader, Center, Badge, Text, Stack, Card, Divider, Alert } from '@mantine/core';
import { IconArrowLeft, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface CartItem {
  id: string;
  cakeType: 'merveilleux' | 'incroyable' | 'plate';
  cakeSize?: '4-6' | '6-8';
  serviceType?: 'takeout' | 'takein';
  cakeText: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  reservation_code: string;
  customer_name_kanji: string;
  customer_name_katakana: string;
  email: string;
  phone_number: string;
  delivery_date_time: string;
  cart_items: CartItem[];
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  candle_count?: string;
  visitor_count?: string;
}

const getCakeName = (type: string) => {
  const names: Record<string, string> = {
    merveilleux: 'Merveilleux',
    incroyable: 'Incroyable',
    plate: 'Plate',
  };
  return names[type] || type;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatPrice = (amount: number) => {
  return `¥${amount.toLocaleString()}`;
};

export function AdminDayView() {
  const { date } = useParams<{ date: string }>();
  const { isAuthenticated, isLoading: authLoading, getToken, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch orders for the date
  useEffect(() => {
    if (!isAuthenticated || !date) return;

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(`/api/admin?action=orders&date=${date}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else if (response.status === 401) {
          logout();
          navigate('/admin', { replace: true });
        } else {
          setError('Error loading orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Server connection error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [date, isAuthenticated, getToken, logout, navigate]);

  const handleDownloadPDF = async () => {
    if (!date) return;

    setIsDownloading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/admin?action=pdf&date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${date?.replace(/-/g, '')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (response.status === 401) {
        logout();
        navigate('/admin', { replace: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Download error');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Server connection error');
    } finally {
      setIsDownloading(false);
    }
  };

  if (authLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Group>
            <Button variant="subtle" onClick={() => navigate('/admin/dashboard')}>
              <IconArrowLeft size={20} />
            </Button>
            <Title order={2}>{formattedDate}</Title>
          </Group>
          <Button leftSection={<IconDownload size={16} />} onClick={handleDownloadPDF} loading={isDownloading} disabled={orders.length === 0}>
            Download PDF
          </Button>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="xl">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : orders.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No orders for this date</Text>
          </Center>
        ) : (
          <Stack gap="md">
            <Text c="dimmed" size="sm">
              {orders.length} order{orders.length > 1 ? 's' : ''}
            </Text>

            {orders.map((order) => (
              <Card key={order.id} shadow="xs" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="sm">
                  <Group>
                    <Text fw={700} size="lg">
                      {formatTime(order.delivery_date_time)}
                    </Text>
                    <Text c="dimmed">•</Text>
                    <Text fw={800} c="dimmed" size="lg">
                      {order.reservation_code}
                    </Text>
                  </Group>
                  <Badge color={order.payment_status === 'completed' ? 'green' : 'orange'} variant="filled">
                    {order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                  </Badge>
                </Group>

                <Divider mb="sm" />

                <Stack gap="xs">
                  <Group>
                    <Text fw={500} w={100}>
                      Customer:
                    </Text>
                    <Text>
                      {order.customer_name_kanji} ({order.customer_name_katakana})
                    </Text>
                  </Group>

                  <Group>
                    <Text fw={500} w={100}>
                      Phone:
                    </Text>
                    <Text>{order.phone_number}</Text>
                  </Group>

                  <Group>
                    <Text fw={500} w={100}>
                      Email:
                    </Text>
                    <Text>{order.email}</Text>
                  </Group>

                  {(order.candle_count || order.visitor_count) && (
                    <Group>
                      {order.candle_count && (
                        <>
                          <Text fw={500}>Candles:</Text>
                          <Text>{order.candle_count}</Text>
                        </>
                      )}
                      {order.visitor_count && (
                        <>
                          <Text fw={500} ml="md">
                            Visitors:
                          </Text>
                          <Text>{order.visitor_count}</Text>
                        </>
                      )}
                    </Group>
                  )}
                </Stack>

                <Divider my="sm" />

                <Text fw={500} mb="xs">
                  Items:
                </Text>
                <Stack gap="xs">
                  {order.cart_items.map((item, index) => (
                    <Card key={index} padding="sm" bg="gray.0" radius="sm">
                      <Group justify="space-between">
                        <Group>
                          <Text fw={500}>
                            {item.quantity} × {getCakeName(item.cakeType)}
                          </Text>
                          {item.cakeSize && (
                            <Badge variant="filled" color="violet">
                              {item.cakeSize} pers.
                            </Badge>
                          )}
                          {item.serviceType && (
                            <Badge variant="filled" color={item.serviceType === 'takein' ? 'cyan' : 'pink'}>
                              {item.serviceType === 'takein' ? 'Dine-in' : 'Takeout'}
                            </Badge>
                          )}
                        </Group>
                        <Text fw={500}>{formatPrice(item.price * item.quantity)}</Text>
                      </Group>
                      {item.cakeText && (
                        <Text size="sm" c="dimmed" mt="xs">
                          Message: "{item.cakeText}"
                        </Text>
                      )}
                    </Card>
                  ))}
                </Stack>

                <Divider my="sm" />

                <Group justify="flex-end">
                  <Text fw={700} size="lg">
                    Total: {formatPrice(order.total_amount)}
                  </Text>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
