// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './auth/useAuth';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#1976d2' },  // your blue
    secondary: { main: '#6c63ff' },  // updated Sign Up color
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

