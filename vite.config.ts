import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(() => ({
  // Use '/' for Vercel deployment
  // Change to '/aux-merveilleux-de-fred-tokyo/' if deploying to GitHub Pages
  base: '/',
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
  optimizeDeps: {
    include: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
}));
