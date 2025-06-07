import { createTheme } from '@mui/material/styles';
import typography from './typography';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb' },
    secondary: { main: '#d97706' },
    background: {
      default: '#f9fafb',
      paper:   '#ffffff',
    },
    text: {
      primary: '#1f2937',
    },
  },
  typography,
});
