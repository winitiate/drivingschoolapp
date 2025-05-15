// src/pages/SchoolAdminDashboard/Settings/LessonSettings.tsx
import React from 'react';
import { Typography, Box, TextField, Button } from '@mui/material';

export default function LessonSettings() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Lesson Settings
      </Typography>
      {/* Example form fields */}
      <TextField label="Default Lesson Duration (minutes)" type="number" fullWidth margin="normal" />
      <TextField label="Cancellation Window (hours)" type="number" fullWidth margin="normal" />
      <Box mt={2}>
        <Button variant="contained">Save Lesson Settings</Button>
      </Box>
    </Box>
  );
}
