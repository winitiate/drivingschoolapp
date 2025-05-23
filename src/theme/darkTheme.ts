import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#2563eb' },
    secondary: { main: '#d97706' },
    background: {
      default: '#1f2937',                  // roughly mytheme “base-content”
      paper:   '#333333',
    },
    text: {
      primary: '#f9fafb',                  // mytheme “base-100”
    },
  },
});
