import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colors: {
    primary: [
      '#fdf9e7',
      '#f9f1c7',
      '#f5e7a3',
      '#F0D891', // Primary color
      '#ebc972',
      '#e6ba53',
      '#e1ab34',
      '#dc9c15',
      '#d78d00',
      '#d27e00',
    ],
  },
  primaryColor: 'primary',
  primaryShade: 3,
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
  other: {
    backgroundColor: '#FEFFFF',
    footerColor: '#000000',
  },
});