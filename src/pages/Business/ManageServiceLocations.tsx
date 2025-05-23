// src/pages/Business/ManageServiceLocations.tsx

/**
 * ManageServiceLocations.tsx
 *
 * Business-owner interface for managing service locations.
 * Fetches only locations belonging to this business and allows adding, editing, and toggling status.
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

import ServiceLocationFormDialog from '../ServiceLocation/ServiceLocationFormDialog';
import ServiceLocationsTable from '../ServiceLocation/ServiceLocationsTable';

import { FirestoreServiceLocationStore } from '../../data/FirestoreServiceLocationStore';
import { FirestoreBusinessStore } from '../../data/FirestoreBusinessStore';
import type { ServiceLocation } from '../../models/ServiceLocation';
import type { Business } from '../../models/Business';

export default function ManageServiceLocations() {
  const { businessId } = useParams<{ businessId: string }>();
  const serviceLocationStore = useMemo(() => new FirestoreServiceLocationStore(), []);
  const businessStore = useMemo(() => new FirestoreBusinessStore(), []);

  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  const [businessName, setBusinessName] = useState<string>('');
  const [bizLoading, setBizLoading]     = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<ServiceLocation | null>(null);

  // Fetch business name by listing all and finding the one we want
  useEffect(() => {
    if (!businessId) return;
    setBizLoading(true);
    businessStore
      .listAll()
      .then((allBiz: Business[]) => {
        const biz = allBiz.find(b => b.id === businessId);
        setBusinessName(biz?.name || '');
      })
      .catch((e: any) => {
        setError(e.message || 'Failed to load business');
      })
      .finally(() => {
        setBizLoading(false);
      });
  }, [businessId, businessStore]);

  // Fetch locations for this business
  const reloadLocations = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const all = await serviceLocationStore.listAll();
      setServiceLocations(all.filter(loc => loc.businessId === businessId));
    } catch (e: any) {
      setError(e.message || 'Failed to load service locations');
    } finally {
      setLoading(false);
    }
  }, [serviceLocationStore, businessId]);

  useEffect(() => {
    reloadLocations();
  }, [reloadLocations]);

  // Create or update a location, ensuring we set the correct businessId
  const handleSave = async (data: ServiceLocation) => {
    if (!businessId) return;
    try {
      await serviceLocationStore.save({ ...data, businessId });
      reloadLocations();
    } catch (e: any) {
      setError(e.message || 'Save failed');
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
        {bizLoading ? (
          <Box display="flex" alignItems="center">
            <CircularProgress size={24} />
            <Typography
              variant="h4"
              component="span"
              sx={{ ml: 2 }}
            >
              Service Locations
            </Typography>
          </Box>
        ) : (
          <Typography variant="h4">
            {businessName} Service Locations
          </Typography>
        )}

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
        businessId={businessId!}
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
