// src/pages/ServiceLocation/Clients/ClientsManager.tsx

/**
 * ClientsManager.tsx
 *
 * Admin interface for managing clients at a specific service location.
 * Fetches clients, enriches with user names, and renders a table and form dialog.
 * Uses ClientStore abstraction for all data operations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';

import ClientFormDialog from '../../../components/Clients/ClientFormDialog';
import ClientsTable, { ClientsTableProps } from '../../../components/Clients/ClientsTable';

import { FirestoreClientStore } from '../../../data/FirestoreClientStore';
import type { Client } from '../../../models/Client';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function ClientsManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const store = useMemo(() => new FirestoreClientStore(), []);
  const db = useMemo(() => getFirestore(), []);

  const [clients, setClients] = useState<Client[]>([]);
  const [usersMap, setUsersMap] = useState<ClientsTableProps['usersMap']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      // fetch clients scoped to this service location
      const list = await store.listByServiceLocation(serviceLocationId);
      setClients(list);

      // build usersMap for name/email lookup
      const map: ClientsTableProps['usersMap'] = {};
      await Promise.all(
        list.map(async (c) => {
          if (!map[c.userId]) {
            const snap = await getDoc(doc(db, 'users', c.userId));
            const data = snap.exists() ? snap.data() as any : {};
            map[c.userId] = {
              firstName: data.firstName || '',
              lastName:  data.lastName  || '',
              email:     data.email     || '',
            };
          }
        })
      );
      setUsersMap(map);
    } catch (e: any) {
      setError(e.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [store, db, serviceLocationId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (data: Partial<Client>) => {
    if (!serviceLocationId) return;
    try {
      // merge serviceLocationIds array
      const base = editing || ({ serviceLocationIds: [] } as Client);
      const newIds = Array.from(
        new Set([...(base.serviceLocationIds || []), serviceLocationId])
      );
      const client: Client = {
        ...(base.id ? base : (data as Client)),
        ...data,
        serviceLocationIds: newIds,
      };
      await store.save(client);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Clients</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Client
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <ClientsTable
          clients={clients}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={(c) => {
            setEditing(c);
            setDialogOpen(true);
          }}
        />
      )}

      <ClientFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
