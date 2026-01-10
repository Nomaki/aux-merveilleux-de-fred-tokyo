import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, Group, Button, Loader, Center, Badge, Text, Stack, SimpleGrid } from '@mantine/core';
import { IconLogout, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface DayCounts {
  [date: string]: {
    total: number;
    paid: number;
    pending: number;
  };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, logout, getToken } = useAdminAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayCounts, setDayCounts] = useState<DayCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch orders for the current month
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrders = async () => {
      setIsLoading(true);
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;

      try {
        const token = getToken();
        const response = await fetch(`/api/admin?action=orders&month=${monthStr}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDayCounts(data.dayCounts || {});
        } else if (response.status === 401) {
          logout();
          navigate('/admin', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentMonth, isAuthenticated, getToken, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  const handleDayClick = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    navigate(`/admin/day/${dateStr}`);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
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

  const monthName = currentMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const calendarDays = generateCalendarDays();

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Title order={2}>Order Management</Title>
          <Button variant="subtle" color="gray" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Logout
          </Button>
        </Group>

        <Group justify="center" mb="md">
          <Button variant="subtle" onClick={handlePrevMonth}>
            <IconChevronLeft size={20} />
          </Button>
          <Title order={3} style={{ minWidth: 200, textAlign: 'center' }}>
            {monthName}
          </Title>
          <Button variant="subtle" onClick={handleNextMonth}>
            <IconChevronRight size={20} />
          </Button>
        </Group>

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            {/* Weekday headers */}
            <SimpleGrid cols={7} spacing="xs" mb="xs">
              {WEEKDAYS.map((day) => (
                <Center key={day}>
                  <Text size="sm" fw={500} c="dimmed">
                    {day}
                  </Text>
                </Center>
              ))}
            </SimpleGrid>

            {/* Calendar grid */}
            <SimpleGrid cols={7} spacing="xs">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} style={{ height: 70 }} />;
                }

                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const counts = dayCounts[dateStr];
                const hasOrders = counts && counts.total > 0;
                const allPaid = hasOrders && counts.pending === 0;

                return (
                  <Paper
                    key={dateStr}
                    p="xs"
                    radius="sm"
                    withBorder={hasOrders}
                    bg={hasOrders ? (allPaid ? 'green.0' : 'orange.0') : undefined}
                    style={{
                      height: 70,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => handleDayClick(date)}
                  >
                    <Stack gap={2} align="center" justify="center" h="100%">
                      <Text size="sm" fw={hasOrders ? 600 : 400}>
                        {date.getDate()}
                      </Text>
                      {hasOrders && (
                        <Badge size="md" color={allPaid ? 'green' : 'orange'} variant="filled">
                          {counts.total}
                        </Badge>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </>
        )}

        <Group justify="center" mt="xl" gap="xl">
          <Group gap="xs">
            <Badge color="green" variant="filled" size="sm">
              N
            </Badge>
            <Text size="sm" c="dimmed">
              All paid
            </Text>
          </Group>
          <Group gap="xs">
            <Badge color="orange" variant="filled" size="sm">
              N
            </Badge>
            <Text size="sm" c="dimmed">
              Payment pending
            </Text>
          </Group>
        </Group>
      </Paper>
    </Container>
  );
}
