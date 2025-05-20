// src/pages/Business/ManageServiceLocations.tsx

/**
 * ManageServiceLocations.tsx
 *
 * Business-owner interface for managing service locations.
 * Fetches only locations owned by this business and allows adding, editing, and toggling status.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import ServiceLocationFormDialog from '../../components/ServiceLocations/ServiceLocationFormDialog';
import ServiceLocationsTable from '../../components/ServiceLocations/ServiceLocationsTable';

import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore';
import type { ServiceLocation } from '../../models/ServiceLocation';

export default function ManageServiceLocations() {
  const { businessId } = useParams<{ businessId: string }>();
  const store = useMemo(() => new FirestoreServiceLocationStore(), []);

  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceLocation | null>(null);

  // Fetch locations owned by this business
  const reloadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await store.listAll();
      setServiceLocations(all.filter(loc => loc.ownerId === businessId));
    } catch (e: any) {
      setError(e.message || 'Failed to load service locations');
    } finally {
      setLoading(false);
    }
  }, [store, businessId]);

  useEffect(() => {
    if (!businessId) return;
    reloadLocations();
  }, [businessId, reloadLocations]);

  // Create or update a location (ensuring correct ownerId)
  const handleSave = async (data: ServiceLocation) => {
    try {
      await store.save({ ...data, ownerId: businessId! });
      reloadLocations();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Toggle status on an existing location
  const handleUpdateStatus = (id: string, status: ServiceLocation['status']) =>
    handleSave({ id, status } as any);

  return (
    <Container maxWidth="md">
      <Box
        mt={4}
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4">My Service Locations</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Location
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <ServiceLocationsTable
          serviceLocations={serviceLocations}
          loading={false}
          error={null}
          onUpdateStatus={handleUpdateStatus}
          onEdit={(loc) => {
            setEditing(loc);
            setDialogOpen(true);
          }}
        />
      )}

      <ServiceLocationFormDialog
        open={dialogOpen}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={(loc) => {
          handleSave(loc);
          setDialogOpen(false);
        }}
      />
    </Container>
  );
}
