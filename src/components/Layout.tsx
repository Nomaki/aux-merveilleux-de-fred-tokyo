import { AppShell, Container, Group, Image, Text, Stack, Button, Anchor } from '@mantine/core';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import { ReservationForm } from '../pages/ReservationForm';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { PaymentPage } from '../pages/PaymentPage';
import { SuccessPage } from '../pages/SuccessPage';
import { SCTAPage } from '../pages/SCTAPage';
import logoSvg from '../assets/logo.svg';
import iconPng from '../assets/icon.png';

export function Layout() {
  const { i18n } = useTranslation();
  const isJapanese = i18n.language === 'ja';

  return (
    <AppShell
      header={{ height: { base: 80, sm: 110 } }}
      footer={{ height: { base: 120, sm: 140 } }}
      padding="md"
      styles={() => ({
        main: {
          backgroundColor: '#fdf9e7',
          fontFamily: 'Poppins, sans-serif',
          overflow: 'auto',
        },
        header: {
          fontFamily: 'Poppins, sans-serif',
          padding: '10px 0',
          '@media (max-width: 48em)': {
            padding: '0',
          },
        },
        footer: {
          fontFamily: 'Poppins, sans-serif',
          padding: '20px 0',
          '@media (max-width: 48em)': {
            padding: '10px 0',
          },
        },
      })}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group justify="center" align="center" h="100%" pos="relative">
            <Anchor component={Link} to="/" style={{ textDecoration: 'none' }}>
              <Image src={logoSvg} alt="Logo" style={{ maxWidth: '180px', height: 'auto', cursor: 'pointer' }} />
            </Anchor>
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
            <Route path="/scta" element={<SCTAPage />} />
          </Routes>
        </Container>
      </AppShell.Main>

      <AppShell.Footer>
        <Container size="sm" h="100%">
          <Stack
            gap="xs"
            justify="center"
            h="100%"
            styles={{
              root: {
                '@media (min-width: 48em)': {
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                },
              },
            }}
          >
            <Group align="flex-start" gap="sm">
              <Image
                src={iconPng}
                alt="Icon"
                w={23}
                h="auto"
                styles={{
                  root: {
                    '@media (max-width: 48em)': {
                      width: '25px',
                    },
                  },
                }}
              />
              <Group align="flex-start" justify="space-between" w="90%">
                <Stack
                  gap={2}
                  style={{ maxWidth: '200px' }}
                  styles={{
                    root: {
                      '@media (min-width: 48em)': {
                        gap: '4px',
                      },
                    },
                  }}
                >
                  <Text
                    fw={600}
                    c="dimmed"
                    size="xs"
                    styles={{
                      root: {
                        '@media (min-width: 48em)': {
                          fontSize: 'var(--mantine-font-size-sm)',
                        },
                      },
                    }}
                  >
                    Aux Merveilleux de Fred
                  </Text>
                  <Text c="dimmed" size="xs" style={{ lineHeight: 1.3 }}>
                    東京都新宿区矢来町107番地2 162-0805
                  </Text>
                  <Text c="dimmed" size="xs" style={{ lineHeight: 1.3 }}>
                    +81 3-5579-8353
                  </Text>

                  <Anchor component={Link} to="/scta" size="xs" c="dimmed">
                    {isJapanese ? '特定商取引法に基づく表記' : 'SCTA Disclosure'}
                  </Anchor>
                </Stack>
                <Group>
                  <Button variant="outline" component="a" href="https://auxmerveilleux.com/ja/contact-us" target="_blank" size="xs">
                    {isJapanese ? 'お問い合わせ' : 'Contact us'}
                  </Button>
                </Group>
              </Group>
            </Group>
          </Stack>
        </Container>
      </AppShell.Footer>
    </AppShell>
  );
}
