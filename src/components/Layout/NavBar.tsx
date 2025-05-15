// src/components/NavBar.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../../auth/useAuth';

export default function NavBar() {
  const { currentUser, signOutUser } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Driving School App
        </Typography>

        {currentUser ? (
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ mr: 2 }}>
              Hello, {currentUser.email}
            </Typography>
            <Button color="inherit" onClick={signOutUser}>
              Sign Out
            </Button>
          </Box>
        ) : (
          <Typography variant="body1">Not signed in</Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}
