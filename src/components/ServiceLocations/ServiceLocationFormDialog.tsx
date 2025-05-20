// src/components/ServiceLocations/ServiceLocationFormDialog.tsx

/**
 * ServiceLocationFormDialog.tsx
 *
 * Modal dialog for creating or editing a service location.
 * - Resolves or creates owner/admin user accounts by email.
 * - Captures name, contact info, address, geo, business hours, website, logo, about, policy.
 * - Uses the ServiceLocationStore abstraction to persist data.
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • initialData?: ServiceLocation — existing data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(loc: ServiceLocation): void — callback after a successful save  
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
import { v4 as uuidv4 } from 'uuid';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

import type { ServiceLocation } from '../../models/ServiceLocation';
import { serviceLocationStore } from '../../data';

interface Props {
  open: boolean;
  initialData?: ServiceLocation;
  onClose: () => void;
  onSave: (loc: ServiceLocation) => void;
}

export default function ServiceLocationFormDialog({
  open,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState<Partial<ServiceLocation>>({
    id: undefined,
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', province: '', postalCode: '' },
    geo: { lat: 0, lng: 0 },
    businessHours: {},
    websiteUrl: '',
    logoUrl: '',
    about: '',
    policy: '',
    faqIds: [],
    serviceProviderIds: [],
    clientIds: [],
    ownerId: '',
    adminIds: [],
  });

  const [ownerEmail, setOwnerEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When editing, seed form and lookup owner/admin emails
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      (async () => {
        // owner email
        const ownerSnap = await getDocs(
          query(collection(db, 'users'), where('uid', '==', initialData.ownerId))
        );
        setOwnerEmail(ownerSnap.docs[0]?.data().email || '');
        // admin emails
        const adminSnaps = await Promise.all(
          (initialData.adminIds || []).map((uid) =>
            getDocs(query(collection(db, 'users'), where('uid', '==', uid)))
          )
        );
        setAdminEmails(
          adminSnaps
            .flatMap((s) => s.docs.map((d) => d.data().email as string))
            .filter(Boolean)
            .join(', ')
        );
      })();
    } else {
      // reset
      setForm({
        id: undefined,
        name: '',
        email: '',
        phone: '',
        address: { street: '', city: '', province: '', postalCode: '' },
        geo: { lat: 0, lng: 0 },
        businessHours: {},
        websiteUrl: '',
        logoUrl: '',
        about: '',
        policy: '',
        faqIds: [],
        serviceProviderIds: [],
        clientIds: [],
        ownerId: '',
        adminIds: [],
      });
      setOwnerEmail('');
      setAdminEmails('');
      setError(null);
    }
  }, [initialData, db]);

  // Generic field updater
  const handleChange = <K extends keyof ServiceLocation>(
    key: K,
    value: any
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Nested updater for address or geo
  const handleNested = <
    Section extends 'address' | 'geo',
    K extends keyof ServiceLocation[Section]
  >(
    section: Section,
    key: K,
    value: any
  ) => {
    setForm((f) => ({
      ...f,
      [section]: { ...(f[section] as any), [key]: value },
    }));
  };

  // Resolve emails to user UIDs (create stub if needed)
  const resolveEmails = async (emails: string[]): Promise<string[]> => {
    const uids: string[] = [];
    for (let raw of emails) {
      const email = raw.trim().toLowerCase();
      if (!email) continue;
      const snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      );
      if (!snap.empty) {
        uids.push(snap.docs[0].id);
      } else {
        const uid = uuidv4();
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          roles: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        uids.push(uid);
      }
    }
    return uids;
  };

  // Submit handler
  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      // 1) Resolve owner
      let ownerId = form.ownerId || '';
      if (ownerEmail) {
        [ownerId] = await resolveEmails([ownerEmail]);
      }

      // 2) Resolve admins
      let adminIds = form.adminIds || [];
      if (adminEmails) {
        adminIds = await resolveEmails(adminEmails.split(','));
      }

      // 3) Build the ServiceLocation object
      const id = isEdit ? form.id! : uuidv4();
      const timestamp = serverTimestamp();
      const loc: ServiceLocation = {
        ...(form as ServiceLocation),
        id,
        ownerId,
        adminIds,
        createdAt: isEdit ? (form.createdAt as any) : timestamp,
        updatedAt: timestamp,
      };

      // 4) Persist via abstraction layer
      await serviceLocationStore.save(loc);

      onSave(loc);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save service location');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? 'Edit Service Location' : 'Add Service Location'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Owner Email */}
          <Grid item xs={12}>
            <TextField
              label="Owner Email"
              type="email"
              fullWidth
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </Grid>

          {/* Admin Emails */}
          <Grid item xs={12}>
            <TextField
              label="Admin Emails (comma-separated)"
              fullWidth
              value={adminEmails}
              onChange={(e) => setAdminEmails(e.target.value)}
            />
          </Grid>

          {/* Name, Email, Phone */}
          {(['name', 'email', 'phone'] as (keyof ServiceLocation)[]).map((field) => (
            <Grid item xs={12} sm={field === 'name' ? 12 : 6} key={field}>
              <TextField
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </Grid>
          ))}

          {/* Address fields */}
          {(['street', 'city', 'province', 'postalCode'] as (keyof ServiceLocation['address'])[]).map(
            (k) => (
              <Grid item xs={12} sm={6} key={k}>
                <TextField
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                  fullWidth
                  value={(form.address as any)[k] || ''}
                  onChange={(e) => handleNested('address', k, e.target.value)}
                />
              </Grid>
            )
          )}

          {/* Geo coordinates */}
          <Grid item xs={6}>
            <TextField
              label="Latitude"
              type="number"
              fullWidth
              value={form.geo?.lat || 0}
              onChange={(e) => handleNested('geo', 'lat', parseFloat(e.target.value))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Longitude"
              type="number"
              fullWidth
              value={form.geo?.lng || 0}
              onChange={(e) => handleNested('geo', 'lng', parseFloat(e.target.value))}
            />
          </Grid>

          {/* Website & Logo */}
          {(['websiteUrl', 'logoUrl'] as (keyof ServiceLocation)[]).map((field) => (
            <Grid item xs={12} key={field}>
              <TextField
                label={field === 'websiteUrl' ? 'Website URL' : 'Logo URL'}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </Grid>
          ))}

          {/* About & Policy */}
          {(['about', 'policy'] as (keyof ServiceLocation)[]).map((field) => (
            <Grid item xs={12} key={field}>
              <TextField
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                multiline
                minRows={3}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </Grid>
          ))}
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
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
