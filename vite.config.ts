import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/aux-merveilleux-de-fred-tokyo/',
  plugins: [
    react({
      babel: {
        plugins: [
          ['@locator/babel-jsx/dist', {
            env: 'development',
          }]
        ]
      }
    })
  ],
});
