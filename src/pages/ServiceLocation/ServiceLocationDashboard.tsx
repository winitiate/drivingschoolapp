// src/pages/ServiceLocation/ServiceLocationDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore';
import type { ServiceLocation } from '../../models/ServiceLocation';

export default function ServiceLocationDashboard() {
  // Only grab serviceLocationId
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  const [locationName, setLocationName] = useState<string>('Service Location');
  const store = React.useMemo(() => new FirestoreServiceLocationStore(), []);

  // fetch the name once we know the ID
  useEffect(() => {
    if (!serviceLocationId) return;
    store.getById(serviceLocationId).then(loc => {
      if (loc?.name) setLocationName(loc.name);
    });
  }, [serviceLocationId, store]);

  // guard: if no ID, nothing to show
  if (!serviceLocationId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Invalid service-location ID</Typography>
      </Box>
    );
  }

  const sections: Array<[string, string]> = [
    ['Clients',              `/service-location/${serviceLocationId}/clients`],
    ['Providers',            `/service-location/${serviceLocationId}/providers`],
    ['Appointments',         `/service-location/${serviceLocationId}/appointments`],
    ['Location Settings',    `/service-location/${serviceLocationId}/settings`],
    ['Appointment Types',    `/service-location/${serviceLocationId}/settings/appointment-types`],
    ['Assessment Types',     `/service-location/${serviceLocationId}/settings/assessment-types`],
    ['Grading Scales',       `/service-location/${serviceLocationId}/settings/grading-scales`],
    ['Packages',             `/service-location/${serviceLocationId}/settings/package-settings`],
    ['Business Hours',       `/service-location/${serviceLocationId}/settings/business-hours`],
    ['FAQ',                  `/service-location/${serviceLocationId}/settings/faq-settings`],
    ['SquareUp',             `/service-location/${serviceLocationId}/settings/square-up-settings`],
    ['Admin Settings',       `/service-location/${serviceLocationId}/settings/admin-settings`],
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {locationName} Service Location Dashboard
      </Typography>

      <Grid container spacing={2} direction="column">
        {sections.map(([label, to]) => (
          <Grid item xs={12} key={label}>
            <Card>
              <CardContent
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">{label}</Typography>
                <Button component={RouterLink} to={to} variant="outlined">
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
