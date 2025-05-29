import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface Props {
  types: { id: string; title: string }[];
  value: string;
  onChange: (id: string) => void;
}

export default function AppointmentTypeSelect({ types, value, onChange }: Props) {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>Appointment Type</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        label="Appointment Type"
      >
        <MenuItem value="">
          <em>Select…</em>
        </MenuItem>
        {types.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
