// src/components/ServiceProviders/ServiceProviderFormDialog.tsx

/**
 * ServiceProviderFormDialog.tsx
 *
 * Modal dialog for creating or editing a service provider.
 * - Resolves or creates the associated user by email.
 * - Captures name, license info, address, background check, rating, availability, etc.
 * - Scopes the provider to the current service location.
 * - Uses the ServiceProviderStore abstraction (singleton) to persist data.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: ServiceProvider — existing provider data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(provider: ServiceProvider): void — callback after save  
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  Alert,
} from '@mui/material';
import { ServiceProvider } from '../../models/ServiceProvider';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { serviceProviderStore } from '../../data';

async function resolveUserByEmail(
  db: ReturnType<typeof getFirestore>,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const usersCol = collection(db, 'users');
  const snap = await getDocs(query(usersCol, where('email', '==', normalized)));
  if (!snap.empty) {
    return snap.docs[0].id;
  } else {
    const uid = uuidv4();
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: normalized,
      firstName: firstName || '',
      lastName: lastName || '',
      roles: ['serviceProvider'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return uid;
  }
}

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData?: ServiceProvider;
  onClose: () => void;
  onSave: (provider: ServiceProvider) => void;
}

export default function ServiceProviderFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState<Partial<ServiceProvider>>({
    id: undefined,
    userId: '',
    licenseNumber: '',
    licenseClass: '',
    address: { street: '', city: '', postalCode: '' },
    backgroundCheck: { date: new Date(), status: 'pending' },
    rating: { average: 0, reviewCount: 0 },
    availability: [],
    blockedTimes: [],
    vehiclesCertifiedFor: [],
    serviceLocationIds: [],
  });

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', initialData.userId));
          if (snap.exists()) {
            const d = snap.data() as any;
            setEmail(d.email || '');
            setFirstName(d.firstName || '');
            setLastName(d.lastName || '');
          }
        } catch {
          // ignore
        }
      })();
    } else {
      setForm({
        id: undefined,
        userId: '',
        licenseNumber: '',
        licenseClass: '',
        address: { street: '', city: '', postalCode: '' },
        backgroundCheck: { date: new Date(), status: 'pending' },
        rating: { average: 0, reviewCount: 0 },
        availability: [],
        blockedTimes: [],
        vehiclesCertifiedFor: [],
        serviceLocationIds: [],
      });
      setEmail('');
      setFirstName('');
      setLastName('');
      setError(null);
    }
  }, [initialData, db]);

  const handleChange = <K extends keyof ServiceProvider>(key: K, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };
  const handleAddress = <K extends keyof ServiceProvider['address']>(key: K, value: any) => {
    setForm(f => ({
      ...f,
      address: { ...(f.address as any), [key]: value },
    }));
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      // Resolve or create the user
      const uid = await resolveUserByEmail(db, email, firstName, lastName);
      // Determine provider ID
      const id = isEdit ? form.id! : uuidv4();

      // Ensure this serviceLocationId is included
      const existingIds = form.serviceLocationIds || [];
      const newIds = Array.from(new Set([...existingIds, serviceLocationId]));

      // Build the provider object
      const provider: ServiceProvider = {
        ...(form as ServiceProvider),
        id,
        userId: uid,
        serviceLocationIds: newIds,
      };

      // Persist via the abstraction layer
      await serviceProviderStore.save(provider);

      onSave(provider);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save provider');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Service Provider' : 'Add Service Provider'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First Name"
              fullWidth
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Last Name"
              fullWidth
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="License Number"
              fullWidth
              value={form.licenseNumber || ''}
              onChange={e => handleChange('licenseNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="License Class"
              fullWidth
              value={form.licenseClass || ''}
              onChange={e => handleChange('licenseClass', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Street"
              fullWidth
              value={form.address?.street || ''}
              onChange={e => handleAddress('street', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="City"
              fullWidth
              value={form.address?.city || ''}
              onChange={e => handleAddress('city', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Postal Code"
              fullWidth
              value={form.address?.postalCode || ''}
              onChange={e => handleAddress('postalCode', e.target.value)}
            />
          </Grid>
        </Grid>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy}
        >
          {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
