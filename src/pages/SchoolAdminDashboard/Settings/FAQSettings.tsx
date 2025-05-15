// src/pages/SchoolAdminDashboard/Settings/FAQSettings.tsx
import React, { useState } from 'react';
import { Typography, Box, TextField, Button, List, ListItem, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FAQSettings() {
  const [faqs, setFaqs] = useState<string[]>([]);
  const [newFaq, setNewFaq] = useState('');

  const addFaq = () => {
    if (newFaq.trim()) {
      setFaqs([...faqs, newFaq.trim()]);
      setNewFaq('');
    }
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        FAQ Settings
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="New FAQ"
          fullWidth
          value={newFaq}
          onChange={e => setNewFaq(e.target.value)}
        />
        <Button variant="contained" onClick={addFaq}>
          Add
        </Button>
      </Box>
      <List>
        {faqs.map((faq, idx) => (
          <ListItem
            key={idx}
            secondaryAction={
              <IconButton edge="end" onClick={() => removeFaq(idx)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            {faq}
          </ListItem>
        ))}
      </List>
      <Box mt={2}>
        <Button variant="contained">Save FAQ Settings</Button>
      </Box>
    </Box>
  );
}
