// src/components/Layout/Footer.jsx

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" py={2} bgcolor="background.paper">
      <Container maxWidth="md">
        <Typography variant="body2" color="textSecondary" align="center">
          &copy; {new Date().getFullYear()} Driving School App
        </Typography>
      </Container>
    </Box>
  );
}
