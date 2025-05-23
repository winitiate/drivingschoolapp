// src/components/Layout/Header.tsx

import React from 'react'
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import NavMenu from './NavMenu'
import ThemeToggle from './ThemeToggle'
import { useDashboardLinks } from '../../hooks/navigation/useDashboardLinks'

export default function Header() {
  const items = useDashboardLinks()

  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <Container
          maxWidth="md"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <NavMenu items={items} />

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              ml: 2,
            }}
          >
            Business Management Software
          </Typography>

          <Box sx={{ ml: 2 }}>
            <ThemeToggle />
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
