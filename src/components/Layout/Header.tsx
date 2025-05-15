import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar disableGutters sx={{ justifyContent: 'center' }}>
        <Container
          maxWidth="md"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ textDecoration: 'none', color: 'inherit' }}
          >
            Driving School
          </Typography>

          <Box>
            <Button color="inherit" component={RouterLink} to="/">Home</Button>
            <Button color="inherit" component={RouterLink} to="/sign-in">Sign In</Button>
            <Button
              color="secondary"
              variant="contained"
              component={RouterLink}
              to="/sign-up"
              sx={{ ml: 1 }}
            >
              Sign Up
            </Button>
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
