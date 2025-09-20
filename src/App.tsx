import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter as Router } from 'react-router-dom';
import { theme } from './theme';
import { Layout } from './components/Layout';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

function App() {
  const basename = import.meta.env.PROD ? '/aux-merveilleux-de-fred-tokyo' : '/';

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <Router basename={basename}>
        <Layout />
      </Router>
    </MantineProvider>
  );
}

export default App;
