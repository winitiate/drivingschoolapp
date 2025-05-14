// src/components/Footer.jsx
import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box component="footer" py={2} bgcolor="background.paper">
      <Container maxWidth="md">
        {/* Navigation Links */}
        <Box display="flex" justifyContent="center" mb={1} flexWrap="wrap">
          <Link component={RouterLink} to="/" color="textSecondary" underline="hover" mx={1}>
            Home
          </Link>
          <Link component={RouterLink} to="/sign-in" color="textSecondary" underline="hover" mx={1}>
            Sign In
          </Link>
          <Link component={RouterLink} to="/sign-up" color="textSecondary" underline="hover" mx={1}>
            Sign Up
          </Link>
          <Link component={RouterLink} to="/student-dashboard" color="textSecondary" underline="hover" mx={1}>
            Student Dashboard
          </Link>
          <Link component={RouterLink} to="/admin/sign-in" color="textSecondary" underline="hover" mx={1}>
            Admin Sign In
          </Link>
          <Link component={RouterLink} to="/admin" color="textSecondary" underline="hover" mx={1}>
            Admin Dashboard
          </Link>
          <Link component={RouterLink} to="/instructor/sign-in" color="textSecondary" underline="hover" mx={1}>
            Instructor Sign In
          </Link>
          <Link component={RouterLink} to="/instructor" color="textSecondary" underline="hover" mx={1}>
            Instructor Dashboard
          </Link>
        </Box>

        {/* Copyright */}
        <Typography variant="body2" color="textSecondary" align="center">
          &copy; {new Date().getFullYear()} Driving School App
        </Typography>
      </Container>
    </Box>
  );
}
