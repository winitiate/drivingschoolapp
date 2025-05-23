// src/components/Layout/ThemeToggle.tsx
import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useColorMode } from '../../contexts/ColorModeContext';

export default function ThemeToggle() {
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();
  const isDark = theme.palette.mode === 'dark';

  return (
    <IconButton
      onClick={toggleColorMode}
      color="inherit"
      aria-label="Toggle light/dark theme"
    >
      {isDark ? <DarkMode /> : <LightMode />}
    </IconButton>
  );
}
