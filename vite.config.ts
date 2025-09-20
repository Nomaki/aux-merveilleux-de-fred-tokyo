import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/aux-merveilleux-de-fred-tokyo/' : '/',
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
}));
