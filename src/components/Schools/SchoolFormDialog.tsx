// src/components/Schools/SchoolFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  Alert
} from '@mui/material';
import { School } from '../../models/School';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  open: boolean;
  initialData?: School;
  onClose: () => void;
  onSave: (school: Partial<School>) => void;
}

export default function SchoolFormDialog({
  open,
  initialData,
  onClose,
  onSave
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState<Partial<School>>({
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
    instructorIds: [],
    studentIds: [],
    ownerId: '',
    adminIds: []
  });

  const [ownerEmail, setOwnerEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  // Seed form and email inputs when editing
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      // Lookup owner email
      (async () => {
        const ownerSnap = await getDocs(
          query(collection(db, 'users'), where('uid', '==', initialData.ownerId))
        );
        setOwnerEmail(ownerSnap.docs[0]?.data().email || '');
        // Lookup admin emails
        const adminSnaps = await Promise.all(
          (initialData.adminIds || []).map(id =>
            getDocs(query(collection(db, 'users'), where('uid', '==', id)))
          )
        );
        const emails = adminSnaps
          .flatMap(s => s.docs.map(d => d.data().email))
          .filter(Boolean)
          .join(', ');
        setAdminEmails(emails);
      })();
    } else {
      // clear
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
        instructorIds: [],
        studentIds: [],
        ownerId: '',
        adminIds: []
      });
      setOwnerEmail('');
      setAdminEmails('');
    }
  }, [initialData, db]);

  const handleChange = <K extends keyof School>(key: K, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleNested = <K extends keyof School['address']>(
    section: 'address' | 'geo',
    key: K,
    value: any
  ) => {
    setForm(f => ({
      ...f,
      [section]: { ...(f[section] as any), [key]: value }
    }));
  };

  // Resolve a list of emails into user UIDs, creating stub users if needed
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
          updatedAt: serverTimestamp()
        });
        uids.push(uid);
      }
    }
    return uids;
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      // 1) Resolve owner
      let ownerId = form.ownerId!;
      if (ownerEmail) {
        [ownerId] = await resolveEmails([ownerEmail]);
      }

      // 2) Resolve admins
      let adminIds = form.adminIds || [];
      if (adminEmails) {
        adminIds = await resolveEmails(adminEmails.split(','));
      }

      // 3) Assemble the final school object
      const school: Partial<School> = {
        ...form,
        ownerId,
        adminIds,
        updatedAt: serverTimestamp(),
        ...(isEdit
          ? {}
          : { id: uuidv4(), createdAt: serverTimestamp() }
        )
      };

      onSave(school);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit School' : 'Create School'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Owner Email */}
          <Grid item xs={12}>
            <TextField
              label="Owner Email"
              type="email"
              fullWidth
              value={ownerEmail}
              onChange={e => setOwnerEmail(e.target.value)}
            />
          </Grid>

          {/* Admin Emails */}
          <Grid item xs={12}>
            <TextField
              label="Admin Emails (comma-separated)"
              fullWidth
              value={adminEmails}
              onChange={e => setAdminEmails(e.target.value)}
            />
          </Grid>

          {/* Name, Email, Phone */}
          {(['name', 'email', 'phone'] as (keyof School)[]).map(field => (
            <Grid item xs={12} sm={field === 'name' ? 12 : 6} key={field}>
              <TextField
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
              />
            </Grid>
          ))}

          {/* Address */}
          {(['street', 'city', 'province', 'postalCode'] as (keyof School['address'])[]).map(k => (
            <Grid item xs={12} sm={6} key={k}>
              <TextField
                label={k.charAt(0).toUpperCase() + k.slice(1)}
                fullWidth
                value={(form.address as any)[k] || ''}
                onChange={e => handleNested('address', k, e.target.value)}
              />
            </Grid>
          ))}

          {/* Geo */}
          <Grid item xs={6}>
            <TextField
              label="Latitude"
              type="number"
              fullWidth
              value={form.geo?.lat || 0}
              onChange={e => handleNested('geo', 'lat', parseFloat(e.target.value))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Longitude"
              type="number"
              fullWidth
              value={form.geo?.lng || 0}
              onChange={e => handleNested('geo', 'lng', parseFloat(e.target.value))}
            />
          </Grid>

          {/* Website & Logo URLs */}
          {(['websiteUrl', 'logoUrl'] as (keyof School)[]).map(field => (
            <Grid item xs={12} key={field}>
              <TextField
                label={field === 'websiteUrl' ? 'Website URL' : 'Logo URL'}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
              />
            </Grid>
          ))}

          {/* About & Policy */}
          {(['about', 'policy'] as (keyof School)[]).map(field => (
            <Grid item xs={12} key={field}>
              <TextField
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                multiline
                minRows={3}
                fullWidth
                value={(form as any)[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
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
          {busy
            ? 'Saving…'
            : isEdit
            ? 'Save Changes'
            : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
