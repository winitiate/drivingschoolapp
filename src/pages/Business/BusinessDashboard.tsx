// src/pages/Business/BusinessDashboard.tsx

import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

export default function BusinessDashboard() {
  const { businessId } = useParams<{ businessId: string }>();

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Business Dashboard
      </Typography>
      <Grid container spacing={2}>
        <Grid item>
          <Button
            component={RouterLink}
            to={`/business/${businessId}/service-locations`}
            variant="contained"
          >
            Manage Locations
          </Button>
        </Grid>
        <Grid item>
          <Button
            component={RouterLink}
            to={`/business/${businessId}/form-templates`}
            variant="contained"
          >
            Form Templates
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
