// src/pages/ServiceLocation/ServiceProviders/ServiceProvidersManager.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FirestoreServiceProviderStore } from '../../../data/FirestoreServiceProviderStore';
import ServiceProvidersTable from '../../../pages/ServiceProvider/ServiceProvidersTable';
import ServiceProviderFormDialog from '../../../pages/ServiceProvider/ServiceProviderFormDialog';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { ServiceProvider } from '../../../models/ServiceProvider';

export default function ServiceProvidersManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const store = React.useMemo(() => new FirestoreServiceProviderStore(), []);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [usersMap, setUsersMap] = useState<
    Record<string, { firstName: string; lastName: string; email: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);

  // Fetch all providers for this location + user info
  useEffect(() => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const all = await store.listAll();
        const filtered = all.filter(p =>
          p.providerLocationIds.includes(serviceLocationId)
        );
        setProviders(filtered);

        const db = getFirestore();
        const map: Record<string, { firstName: string; lastName: string; email: string }> = {};
        await Promise.all(
          filtered.map(async p => {
            if (!map[p.userId]) {
              const snap = await getDoc(doc(db, 'users', p.userId));
              if (snap.exists()) {
                const d = snap.data() as any;
                map[p.userId] = {
                  firstName: d.firstName || '',
                  lastName:  d.lastName  || '',
                  email:     d.email     || '',
                };
              } else {
                map[p.userId] = { firstName: '', lastName: '', email: '' };
              }
            }
          })
        );
        setUsersMap(map);
      } catch (e: any) {
        setError(e.message || 'Failed to load providers');
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  // After saving a provider, also ensure the user role, then update local lists
  const handleSave = async (saved: ServiceProvider) => {
    // 1) Persist provider
    await store.save(saved);

    // 2) Update local provider list
    setProviders(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    // 3) Patch user roles (already done in store, but refresh local copy)
    const db = getFirestore();
    const userRef = doc(db, 'users', saved.userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data() as any;
      setUsersMap(m => ({
        ...m,
        [saved.userId]: {
          firstName: d.firstName || '',
          lastName:  d.lastName  || '',
          email:     d.email     || '',
        },
      }));
    }

    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Service Providers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Provider
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <ServiceProvidersTable
          serviceProviders={providers}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={p => {
            setEditing(p);
            setDialogOpen(true);
          }}
        />
      )}

      <ServiceProviderFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
