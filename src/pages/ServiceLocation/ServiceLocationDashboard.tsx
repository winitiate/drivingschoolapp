// src/pages/ServiceLocation/ServiceLocationDashboard.tsx
import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';

export default function ServiceLocationDashboard() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  const sections: Array<[string, string]> = [
    ['Clients',          `/service-location/${serviceLocationId}/clients`],
    ['Providers',        `/service-location/${serviceLocationId}/providers`],
    ['Appointments',     `/service-location/${serviceLocationId}/appointments`],
    ['Appointment Types',`/service-location/${serviceLocationId}/settings/appointment-types`],
    ['Assessment Types', `/service-location/${serviceLocationId}/settings/assessment-types`],
    ['Grading Scales',   `/service-location/${serviceLocationId}/settings/grading-scales`],
    ['Packages',         `/service-location/${serviceLocationId}/settings/package-settings`],
    ['Business Hours',   `/service-location/${serviceLocationId}/settings/business-hours`],
    ['FAQ',              `/service-location/${serviceLocationId}/settings/faq-settings`],
    ['SquareUp',         `/service-location/${serviceLocationId}/settings/square-up-settings`],
    ['Admin Settings',   `/service-location/${serviceLocationId}/settings/admin-settings`],
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Service Location Admin Dashboard
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Managing: <strong>{/* look up and render the name here */}</strong>
      </Typography>

      <Grid container spacing={2} direction="column">
        {sections.map(([label, to]) => (
          <Grid item xs={12} key={label}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{label}</Typography>
                <Button
                  component={RouterLink}
                  to={to}
                  variant="outlined"
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
