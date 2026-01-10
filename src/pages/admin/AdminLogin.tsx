import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, PasswordInput, Button, Alert, Stack } from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(password);
    if (success) {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <Container size="xs" py={100}>
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Stack gap="lg">
          <Title order={2} ta="center">
            Administration
          </Title>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}

              <PasswordInput
                label="Mot de passe"
                placeholder="Entrez le mot de passe"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                autoFocus
              />

              <Button type="submit" fullWidth loading={isLoading} disabled={!password}>
                Connexion
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
