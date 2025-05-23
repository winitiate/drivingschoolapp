import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb' },        // your “mytheme” primary
    secondary: { main: '#d97706' },        // your “mytheme” secondary
    background: {
      default: '#f9fafb',                  // mytheme base-100
      paper:   '#ffffff',
    },
    text: {
      primary: '#1f2937',                  // mytheme base-content
    },
  },
});
