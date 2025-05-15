// src/pages/SchoolAdminDashboard/Settings/AdminSettings.tsx
import React, { useState } from 'react';
import {
  Typography, Box, TextField, Button, List, ListItem, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AdminSettings() {
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const addAdmin = () => {
    if (newAdminEmail.trim()) {
      setAdmins([...admins, newAdminEmail.trim()]);
      setNewAdminEmail('');
    }
  };

  const removeAdmin = (index: number) => {
    setAdmins(admins.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Admin Settings
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="New Admin Email"
          type="email"
          fullWidth
          value={newAdminEmail}
          onChange={e => setNewAdminEmail(e.target.value)}
        />
        <Button variant="contained" onClick={addAdmin}>
          Add
        </Button>
      </Box>
      <List>
        {admins.map((email, idx) => (
          <ListItem
            key={idx}
            secondaryAction={
              <IconButton edge="end" onClick={() => removeAdmin(idx)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            {email}
          </ListItem>
        ))}
      </List>
      <Box mt={2}>
        <Button variant="contained">Save Admin Settings</Button>
      </Box>
    </Box>
  );
}
