import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { theme } from './theme';
import { Layout } from './components/Layout';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import 'dayjs/locale/ja';

function App() {
  const { i18n } = useTranslation();
  // Use '/' for Vercel deployment
  // Change to '/aux-merveilleux-de-fred-tokyo' if deploying to GitHub Pages
  const basename = '/';

  return (
    <MantineProvider theme={theme}>
      <DatesProvider settings={{ locale: i18n.language === 'ja' ? 'ja' : 'en' }}>
        <Notifications />
        <Router basename={basename}>
          <Layout />
        </Router>
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;
