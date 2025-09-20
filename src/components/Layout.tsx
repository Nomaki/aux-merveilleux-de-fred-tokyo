import { AppShell, Container, Group, Image, Text, Stack, Button } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import { LanguageToggle } from './LanguageToggle';
import { ReservationForm } from '../pages/ReservationForm';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { SuccessPage } from '../pages/SuccessPage';
import logoSvg from '../assets/logo.svg';
import iconPng from '../assets/icon.png';

export function Layout() {
  return (
    <AppShell
      header={{ height: 130 }}
      footer={{ height: 140 }}
      padding="md"
      styles={() => ({
        main: {
          backgroundColor: '#fdf9e7',
          fontFamily: 'Poppins, sans-serif',
          overflow: 'auto',
        },
        header: {
          fontFamily: 'Poppins, sans-serif',
          padding: '20px 0',
        },
        footer: {
          fontFamily: 'Poppins, sans-serif',
          padding: '20px 0',
        },
      })}
    >
      <AppShell.Header>
        <Container size="lg">
          <Group justify="center" align="center" py="md" pos="relative">
            <Image src={logoSvg} alt="Logo" style={{ maxWidth: '200px', height: 'auto' }} />
            <div style={{ position: 'absolute', right: 0 }}>
              <LanguageToggle />
            </div>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="sm" px={{ base: 0, xs: 'xl' }}>
          <Routes>
            <Route path="/" element={<ReservationForm />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/success" element={<SuccessPage />} />
          </Routes>
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <Container size="lg">
          <Group justify="space-between" align="flex-start" py="lg">
            <Group align="flex-start" gap="xl">
              <Image src={iconPng} alt="Icon" style={{ maxWidth: '40px', height: 'auto' }} />
              <Stack gap="xs">
                <Text fw={600} c="dimmed" size="sm">
                  Aux Merveilleux de Fred
                </Text>
                <Text c="dimmed" size="xs">
                  東京都新宿区矢来町107番地2 162-0805
                </Text>
                <Text c="dimmed" size="xs">
                  +81 3-5579-8353
                </Text>
              </Stack>
            </Group>
            <Button variant="outline" component="a" href="https://auxmerveilleux.com/ja/contact-us" target="_blank" size="sm">
              Contact us
            </Button>
          </Group>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
