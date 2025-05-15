// src/pages/SchoolAdminDashboard/Settings/SquareUpSettings.tsx
import React from 'react';
import { Typography, Box, TextField, Button } from '@mui/material';

export default function SquareUpSettings() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SquareUp Settings
      </Typography>
      {/* Example form fields */}
      <TextField label="Square Application ID" fullWidth margin="normal" />
      <TextField label="Square Access Token" fullWidth margin="normal" />
      <Box mt={2}>
        <Button variant="contained">Save SquareUp Settings</Button>
      </Box>
    </Box>
  );
}
