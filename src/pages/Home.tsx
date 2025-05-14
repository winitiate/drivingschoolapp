import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Home() {
  return (
    <Box textAlign="center" py={4}>
      <Typography variant="h3" gutterBottom>
        Welcome to the Driving School App
      </Typography>
      <Typography variant="body1" paragraph>
        Learn to drive with confidence. Manage your lessons, track progress, and stay connected.
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        mt={4}
      >
        <Button
          component={RouterLink}
          to="/sign-up"
          variant="contained"
          color="primary"
          size="large"
          fullWidth={{ xs: true, sm: false }}
        >
          Get Started
        </Button>
        <Button
          component={RouterLink}
          to="/sign-in"
          variant="outlined"
          size="large"
          fullWidth={{ xs: true, sm: false }}
        >
          Sign In
        </Button>
      </Stack>
    </Box>
  );
}
