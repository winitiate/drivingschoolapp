// src/pages/SuperAdmin/SuperAdminFormTemplates.tsx

import React from "react";
import { Container, Box, Typography, Paper } from "@mui/material";
import FormTemplateManager from "../FormTemplates/FormTemplateManager";

export default function SuperAdminFormTemplates() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Form Templates
      </Typography>
      <Paper sx={{ p: 2 }}>
        <FormTemplateManager ownerType="global" />
      </Paper>
    </Container>
  );
}
