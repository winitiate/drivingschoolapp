// src/components/Layout/Header.tsx

import React from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import NavMenu from './NavMenu';
import { useAuth } from '../../auth/useAuth';
import { useNavItems } from '../../hooks/useNavItems';

export default function Header() {
  const { user } = useAuth();
  const items = useNavItems();

  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        {/* 1) This Container inside the Toolbar constrains only the content */}
        <Container
          maxWidth="md"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ─────── Brand on the left ─────── */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            Business Management Software
          </Typography>

          {/* ─────── Nav links / menu / toggle on the right ─────── */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user
              ? <NavMenu items={items} />
              : items.map(item => (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{ textTransform: 'none', ml: 1 }}
                  >
                    {item.label}
                  </Button>
                ))
            }
            <Box sx={{ ml: 2 }}>
              <ThemeToggle />
            </Box>
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
