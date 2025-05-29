import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface Provider {
  id: string;
  name: string;
}

interface Props {
  providers: Provider[];
  value: string;
  onChange: (id: string) => void;
}

export default function ProviderSelect({ providers, value, onChange }: Props) {
  return (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel>Service Provider</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        label="Service Provider"
      >
        <MenuItem value="any">(Any)</MenuItem>
        {providers.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
