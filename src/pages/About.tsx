// src/pages/About.tsx

import React from "react"
import { Container, Box, Typography, Divider, Stack } from "@mui/material"

export default function About() {
  return (
    <Container maxWidth="md" sx={{ pt: 8, pb: 8 }}>
      {/* Page header */}
      <Typography
        variant="h3"
        component="h1"
        align="center"
        gutterBottom
        sx={{ fontWeight: 700 }}
      >
        About Our Platform
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {/* Introduction section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="body1" paragraph>
          Our all-in-one appointment and location management system was built 
          to streamline operations for businesses with multiple service locations. 
          Whether you’re a business owner, service provider, or client, you’ll 
          find the tools you need to manage schedules, process payments, and 
          track performance—all in a single intuitive dashboard.
        </Typography>
        <Typography variant="body1">
          From setting up new locations and inviting service providers, to 
          allowing clients to book appointments, our platform ensures everyone 
          stays connected and on schedule.
        </Typography>
      </Box>

      {/* Features breakdown */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
          What We Offer
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              1. Multi‐Location Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and configure multiple service locations under a single 
              business account. Manage each location’s settings, hours, and staff 
              with ease.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              2. Role‐Based Access & Controls
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign roles for business owners, service providers, and clients. 
              Each role has tailored dashboards and permissions to keep workflows 
              secure and organized.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              3. Smart Scheduling & Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Service providers can define their availability, and clients can 
              book appointments in a few clicks. Automated reminders and conflict‐
              detection prevent double-bookings and no-shows.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              4. Integrated Payments & Billing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accept payments from clients, issue refunds when needed, and 
              generate revenue reports—all without leaving the platform.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              5. Assessment & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Capture assessments, track key performance metrics, and gain 
              insights into provider performance and client satisfaction. 
              Export reports to measure growth over time.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Closing statement */}
      <Box>
        <Typography variant="body1" paragraph>
          We built this platform to give businesses of all sizes the tools they 
          need to grow efficiently. Whether you’re operating from a single 
          location or managing a network of service providers, our mission is to 
          simplify your day-to-day so you can focus on what matters—delivering 
          exceptional service to your clients.
        </Typography>
        <Typography variant="body1">
          Ready to experience seamless location and appointment management? 
          Click “Get Started” at the top of the page to sign up or sign in today.
        </Typography>
      </Box>
    </Container>
  )
}
