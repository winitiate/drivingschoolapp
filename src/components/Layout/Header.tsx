// src/components/Layout/Header.tsx

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAbility } from '../../hooks/useAbility';

export default function Header() {
  const { user, signOutUser } = useAuth();
  const ability = useAbility();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const items: Array<{ label: string; to?: string; action?: () => void }> = [];

  // Always show Home
  if (ability.can('viewHome')) {
    items.push({ label: 'Home', to: '/' });
  }

  if (!user) {
    // Public links
    items.push({ label: 'Client Sign In', to: '/sign-in' });
    items.push({ label: 'Client Sign Up', to: '/sign-up' });
    items.push({ label: 'Business Sign In', to: '/business/sign-in' });
    items.push({ label: 'Business Sign Up', to: '/business/sign-up' });
  } else {
    // Super-Admin Dashboard
    if (ability.can('manageBusinesses')) {
      items.push({ label: 'Super Admin Dashboard', to: '/super-admin' });
    }

    // Business Owner Dashboard(s)
    if (ability.can('viewBusinesses')) {
      user.businessIds.forEach(bizId => {
        items.push({
          label: 'Business Owner Dashboard',
          to: `/business/${bizId}`
        });
      });
    }

    // Service-Location Admin Dashboard(s)
    if (ability.can('manageLocationTemplates')) {
      user.serviceLocationIds.forEach(locId => {
        items.push({
          label: 'Service Location Dashboard',
          to: `/service-location/${locId}`
        });
      });
    }

    // Service Provider Dashboard
    if (ability.can('viewOwnTemplates') && user.roles.includes('serviceProvider')) {
      items.push({ label: 'Service Provider Dashboard', to: '/service-provider' });
    }

    // Client Dashboard
    if (ability.can('viewOwnTemplates') && user.roles.includes('client')) {
      items.push({ label: 'Client Dashboard', to: '/client' });
    }

    // Sign Out
    items.push({ label: 'Sign Out', action: () => signOutUser() });
  }

  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <Container
          maxWidth="md"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <IconButton edge="start" color="inherit" onClick={handleMenuClick}>
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, ml: 2 }}
          >
            Driving School
          </Typography>

          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            {items.map(({ label, to, action }) =>
              to ? (
                <MenuItem
                  key={to}
                  component={RouterLink}
                  to={to}
                  onClick={handleMenuClose}
                >
                  {label}
                </MenuItem>
              ) : (
                <MenuItem
                  key={label}
                  onClick={() => {
                    handleMenuClose();
                    action?.();
                  }}
                >
                  {label}
                </MenuItem>
              )
            )}
          </Menu>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
