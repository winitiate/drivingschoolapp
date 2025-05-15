// src/pages/SchoolAdminDashboard/Settings/BusinessHoursSettings.tsx
import React from 'react';
import { Typography, Box, TextField, Button, Grid } from '@mui/material';

export default function BusinessHoursSettings() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Business Hours Settings
      </Typography>
      <Grid container spacing={2}>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
          <React.Fragment key={day}>
            <Grid item xs={12} sm={4}>
              <Typography>{day}</Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Open Time" type="time" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Close Time" type="time" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
      <Box mt={2}>
        <Button variant="contained">Save Business Hours</Button>
      </Box>
    </Box>
  );
}
