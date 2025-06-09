// src/components/Appointments/AppointmentFormDialog/CoreFields.tsx

import React from "react";
import { Box, TextField, MenuItem, Typography, Checkbox, ListItemText } from "@mui/material";
import { Option } from "./types";

interface CoreFieldsProps {
  appointmentTypeId: string;
  clientIds: string[];
  serviceProviderId: string;
  appointmentTypes: Option[];
  clients: Option[];
  serviceProviders: Option[];
  canEditClient: boolean;
  canEditAppointmentType: boolean;
  canEditProvider: boolean;
  onChangeType: (id: string) => void;
  onChangeClient: (ids: string[]) => void;
  onChangeProvider: (id: string) => void;
  showProviderPicker: boolean;
}

export function CoreFields({
  appointmentTypeId,
  clientIds,
  serviceProviderId,
  appointmentTypes,
  clients,
  serviceProviders,
  canEditClient,
  canEditAppointmentType,
  canEditProvider,
  onChangeType,
  onChangeClient,
  onChangeProvider,
  showProviderPicker,
}: CoreFieldsProps) {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        select
        label="Appointment Type"
        value={appointmentTypeId}
        onChange={(e) => onChangeType(e.target.value)}
        fullWidth
        disabled={!canEditAppointmentType}
      >
        {appointmentTypes.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Client"
        value={clientIds[0] ?? ""}
        onChange={(e) => onChangeClient([e.target.value])}
        fullWidth
        disabled={!canEditClient}
      >
        {clients.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
        ))}
      </TextField>

      {showProviderPicker && (
        <TextField
          select
          label="Service Provider"
          value={serviceProviderId}
          onChange={(e) => onChangeProvider(e.target.value)}
          fullWidth
          disabled={!canEditProvider}
        >
          {serviceProviders.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
          ))}
        </TextField>
      )}

      {!showProviderPicker && (
        <Box>
          <Typography variant="subtitle2">Service Provider</Typography>
          <Typography variant="body1">
            {serviceProviders.find((sp) => sp.id === serviceProviderId)?.label || "—"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
