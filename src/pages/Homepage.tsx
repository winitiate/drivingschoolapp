// src/pages/Homepage.tsx

import React from "react"
import { Box, Container, Typography, Button, Stack } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

export default function Homepage() {
  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 8 }}>
      {/* Main heading */}
      <Typography
        variant="h3"
        component="h1"
        align="center"
        gutterBottom
        sx={{ fontWeight: 700 }}
      >
        All-in-One Appointment & Location Management
      </Typography>

      {/* Subheading/description */}
      <Typography
        variant="body1"
        align="center"
        sx={{ mb: 6, color: "text.secondary" }}
      >
        Empower your business with a single platform to oversee service locations, 
        manage your providers and clients, handle scheduling and payments, and track performance through assessments—all from one dashboard.
      </Typography>

      {/* Call-to-action buttons */}
      <Stack spacing={2} justifyContent="center" alignItems="center">
        <Button
          component={RouterLink}
          to="/sign-in"
          variant="contained"
          size="large"
          sx={{ width: "100%", maxWidth: 300 }}
        >
          Get Started
        </Button>

        <Button
          component={RouterLink}
          to="/about"
          variant="outlined"
          size="large"
          sx={{ width: "100%", maxWidth: 300 }}
        >
          Learn More
        </Button>
      </Stack>

      {/* Features section */}
      <Box sx={{ mt: 10 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          Key Features
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "8px",
                mr: 1,
              }}
            />
            <Typography variant="body2">
              <strong>Multi‐Location Support:</strong> Add and configure multiple service locations under one account.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "8px",
                mr: 1,
              }}
            />
            <Typography variant="body2">
              <strong>Provider & Client Management:</strong> Invite service providers and clients, assign them to locations, and control access.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "8px",
                mr: 1,
              }}
            />
            <Typography variant="body2">
              <strong>Smart Scheduling:</strong> Create, edit, and view appointments on an intuitive calendar—automate reminders and avoid double-books.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "8px",
                mr: 1,
              }}
            />
            <Typography variant="body2">
              <strong>Seamless Payments:</strong> Process client payments, issue refunds, and track revenue—all within the same platform.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mt: "8px",
                mr: 1,
              }}
            />
            <Typography variant="body2">
              <strong>Assessments & Reporting:</strong> Record assessments, generate performance reports, and monitor key metrics for each provider and location.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Closing CTA */}
      <Box sx={{ mt: 12, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Ready to streamline your operations?
        </Typography>
        <Button
          component={RouterLink}
          to="/sign-in"
          variant="contained"
          size="medium"
          sx={{ width: "100%", maxWidth: 240 }}
        >
          Sign In or Sign Up
        </Button>
      </Box>
    </Container>
  )
}
