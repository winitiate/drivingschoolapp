import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import BusinessTable from './BusinessTable';
import BusinessFormDialog from './BusinessFormDialog';
import { useBusinesses } from '../../../hooks/Businesses/useBusinesses';
import { Business } from '../../../models/Business';

export default function ManageBusinesses() {
  const { businesses, loading, error, reload } = useBusinesses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Business | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (biz: Business) => {
    setEditing(biz);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Manage Businesses</Typography>
        <Button variant="contained" onClick={openNew}>
          New Business
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <BusinessTable businesses={businesses} onEdit={openEdit} />
      )}

      <BusinessFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        business={editing}
        onSaved={() => {
          reload();
          setDialogOpen(false);
        }}
      />
    </Box>
  );
}
