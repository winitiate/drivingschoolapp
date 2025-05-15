// src/pages/SchoolAdminDashboard/Settings/PackageSettings.tsx
import React from 'react';
import { Typography, Box, TextField, Button } from '@mui/material';

export default function PackageSettings() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Package Settings
      </Typography>
      {/* Example form fields */}
      <TextField label="Standard Package Price" type="number" fullWidth margin="normal" />
      <TextField label="Standard Package Lessons Count" type="number" fullWidth margin="normal" />
      <Box mt={2}>
        <Button variant="contained">Save Package Settings</Button>
      </Box>
    </Box>
  );
}
