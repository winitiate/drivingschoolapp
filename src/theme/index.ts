// src/theme/index.ts

import { createTheme, ThemeOptions } from '@mui/material/styles';
import { lightTheme as baseLight } from './lightTheme';
import { darkTheme as baseDark } from './darkTheme';

// Shared overrides for all Containers
const containerOverrides: ThemeOptions = {
  components: {
    MuiContainer: {
      // cap width at “md” (≈960px) unless you override per-instance
      defaultProps: {
        maxWidth: 'md',
      },
      styleOverrides: {
        // give every Container side padding
        root: ({ theme }) => ({
          paddingLeft: theme.spacing(20),
          paddingRight: theme.spacing(20),
        }),
      },
    },
  },
};

// Merge container overrides into your light & dark themes
export const lightTheme = createTheme(baseLight, containerOverrides);
export const darkTheme  = createTheme(baseDark,  containerOverrides);
