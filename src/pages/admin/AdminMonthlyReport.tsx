import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, Group, Button, Loader, Center, Table, Text, Stack, Select } from '@mantine/core';
import { IconArrowLeft, IconDownload } from '@tabler/icons-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface TaxCategory {
  rate: string;
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
}

interface MonthlyReport {
  month: string;
  orderCount: number;
  takeout: TaxCategory;
  takein: TaxCategory;
  totals: {
    itemCount: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  // Generate last 12 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
    options.push({ value, label });
  }

  return options;
}

export function AdminMonthlyReport() {
  const { isAuthenticated, isLoading: authLoading, getToken } = useAdminAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch report when month changes
  useEffect(() => {
    if (!isAuthenticated || !selectedMonth) return;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(`/api/admin?action=report&month=${selectedMonth}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReport(data.report);
        } else if (response.status === 401) {
          navigate('/admin', { replace: true });
        } else {
          setError('Erreur lors du chargement du rapport');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [selectedMonth, isAuthenticated, getToken, navigate]);

  const handleExportCSV = () => {
    if (!report) return;

    const monthLabel = new Date(report.month + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

    const csvContent = [
      ['Monthly Tax Report', monthLabel],
      [''],
      ['Category', 'Tax Rate', 'Item Count', 'Subtotal (excl. tax)', 'Tax Amount', 'Total (incl. tax)'],
      ['Takeout (Take out)', report.takeout.rate, report.takeout.itemCount, report.takeout.subtotal, report.takeout.tax, report.takeout.total],
      ['Take-in (Dine-in)', report.takein.rate, report.takein.itemCount, report.takein.subtotal, report.takein.tax, report.takein.total],
      [''],
      ['TOTAL', '', report.totals.itemCount, report.totals.subtotal, report.totals.tax, report.totals.total],
      [''],
      ['Total Orders', report.orderCount],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax-report-${report.month}.csv`;
    link.click();
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

  const monthOptions = generateMonthOptions();

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Group justify="space-between" mb="xl">
          <Group>
            <Button variant="subtle" onClick={() => navigate('/admin/dashboard')}>
              <IconArrowLeft size={20} />
            </Button>
            <Title order={2}>Monthly Tax Report</Title>
          </Group>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportCSV}
            disabled={!report}
          >
            Export CSV
          </Button>
        </Group>

        <Select
          label="Select Month"
          value={selectedMonth}
          onChange={(value) => value && setSelectedMonth(value)}
          data={monthOptions}
          mb="xl"
          style={{ maxWidth: 250 }}
        />

        {isLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : error ? (
          <Center py="xl">
            <Text c="red">{error}</Text>
          </Center>
        ) : report ? (
          <Stack gap="lg">
            <Text size="sm" c="dimmed">
              Total orders: {report.orderCount}
            </Text>

            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Tax Rate</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Items</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Subtotal (excl. tax)</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Tax Amount</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Total (incl. tax)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>
                    <Text fw={500}>Takeout</Text>
                    <Text size="xs" c="dimmed">お持ち帰り</Text>
                  </Table.Td>
                  <Table.Td>{report.takeout.rate}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{report.takeout.itemCount}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takeout.subtotal)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takeout.tax)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takeout.total)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>
                    <Text fw={500}>Take-in / Dine-in</Text>
                    <Text size="xs" c="dimmed">店内飲食</Text>
                  </Table.Td>
                  <Table.Td>{report.takein.rate}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{report.takein.itemCount}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takein.subtotal)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takein.tax)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.takein.total)}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr style={{ fontWeight: 'bold', backgroundColor: 'var(--mantine-color-gray-1)' }}>
                  <Table.Td colSpan={2}>TOTAL</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{report.totals.itemCount}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.totals.subtotal)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.totals.tax)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(report.totals.total)}</Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>

            <Paper p="md" bg="blue.0" radius="sm">
              <Stack gap="xs">
                <Text size="sm" fw={500}>Tax Summary</Text>
                <Group justify="space-between">
                  <Text size="sm">8% Tax (Takeout):</Text>
                  <Text size="sm" fw={500}>{formatCurrency(report.takeout.tax)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">10% Tax (Dine-in):</Text>
                  <Text size="sm" fw={500}>{formatCurrency(report.takein.tax)}</Text>
                </Group>
                <Group justify="space-between" style={{ borderTop: '1px solid var(--mantine-color-blue-3)', paddingTop: 8 }}>
                  <Text size="sm" fw={600}>Total Tax:</Text>
                  <Text size="sm" fw={600}>{formatCurrency(report.totals.tax)}</Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </Paper>
    </Container>
  );
}
