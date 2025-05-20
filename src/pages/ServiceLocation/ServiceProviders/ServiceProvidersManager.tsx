/**
 * ServiceProvidersManager.tsx
 *
 * Admin interface for managing service providers at a specific service location.
 * Fetches service providers via the ServiceProviderStore abstraction,
 * enriches with user names, and renders a table and form dialog.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

import ServiceProviderFormDialog from '../../../components/ServiceProviders/ServiceProviderFormDialog';
import ServiceProvidersTable, {
  ServiceProvidersTableProps
} from '../../../components/ServiceProviders/ServiceProvidersTable';

import { FirestoreServiceProviderStore } from '../../../data/FirestoreServiceProviderStore';
import type { ServiceProvider } from '../../../models/ServiceProvider';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function ServiceProvidersManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const store = useMemo(() => new FirestoreServiceProviderStore(), []);
  const db = useMemo(() => getFirestore(), []);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [usersMap, setUsersMap] = useState<ServiceProvidersTableProps['usersMap']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      // fetch service providers scoped to this location
      const list = await store.listByServiceLocation(serviceLocationId);
      setProviders(list);

      // build usersMap for name/email lookup
      const map: ServiceProvidersTableProps['usersMap'] = {};
      await Promise.all(
        list.map(async (sp) => {
          if (!map[sp.userId]) {
            const snap = await getDoc(doc(db, 'users', sp.userId));
            const data = snap.exists() ? (snap.data() as any) : {};
            map[sp.userId] = {
              firstName: data.firstName || '',
              lastName:  data.lastName  || '',
              email:     data.email     || '',
            };
          }
        })
      );
      setUsersMap(map);
    } catch (e: any) {
      setError(e.message || 'Failed to load service providers');
    } finally {
      setLoading(false);
    }
  }, [store, db, serviceLocationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (data: Partial<ServiceProvider>) => {
    if (!serviceLocationId) return;
    try {
      // ensure this locationId is included
      const base = editing || ({ serviceLocationIds: [] } as ServiceProvider);
      const merged: ServiceProvider = {
        ...(base.id ? base : (data as ServiceProvider)),
        ...data,
        serviceLocationIds: Array.from(new Set([
          ...(base.serviceLocationIds || []),
          serviceLocationId
        ])),
      };
      await store.save(merged);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Service Providers</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Service Provider
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <ServiceProvidersTable
          serviceProviders={providers}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={(sp) => {
            setEditing(sp);
            setDialogOpen(true);
          }}
        />
      )}

      <ServiceProviderFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing ?? undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
