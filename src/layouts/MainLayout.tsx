import React, { ReactNode } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Container, Box } from '@mui/material';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />

      <Container
        component="main"
        sx={{ flex: 1, py: 4 }}
        maxWidth="md"
      >
        {children}
      </Container>

      <Footer />
    </Box>
  );
}
