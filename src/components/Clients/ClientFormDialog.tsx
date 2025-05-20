// src/components/Clients/ClientFormDialog.tsx

/**
 * ClientFormDialog.tsx
 *
 * Modal dialog for creating or editing a client (formerly “student”).
 * - Resolves or creates the associated user by email.
 * - Captures client details (license, address, emergency contact, progress, docs, etc.).
 * - Scopes the client to the current service location.
 * - Persists via the ClientStore abstraction (singleton).
 *
 * Props:
 *  • open: boolean — whether the dialog is visible  
 *  • serviceLocationId: string — ID of the current service location  
 *  • initialData?: Client — existing client data for edit mode  
 *  • onClose(): void — callback to close the dialog  
 *  • onSave(client: Client): void — callback after successful save  
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
  Checkbox,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { Client } from '../../models/Client';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { clientStore } from '../../data';

async function resolveUserByEmail(
  db: ReturnType<typeof getFirestore>,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const usersCol = collection(db, 'users');
  const snap = await getDocs(query(usersCol, where('email', '==', normalized)));
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  const uid = uuidv4();
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: normalized,
    firstName,
    lastName,
    roles: ['client'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

interface ClientFormDialogProps {
  open: boolean;
  serviceLocationId: string;
  initialData?: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

export default function ClientFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: ClientFormDialogProps) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  // User profile fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Client-specific fields
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceClass, setLicenceClass] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [learnerPermitExpiry, setLearnerPermitExpiry] = useState('');
  const [emName, setEmName] = useState('');
  const [emRelation, setEmRelation] = useState('');
  const [emPhone, setEmPhone] = useState('');
  const [roadTestAppointment, setRoadTestAppointment] = useState('');
  const [banned, setBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [totalLessons, setTotalLessons] = useState(0);
  const [skillsMastered, setSkillsMastered] = useState('');
  const [licenceCopyUrl, setLicenceCopyUrl] = useState('');
  const [permitCopyUrl, setPermitCopyUrl] = useState('');
  const [otherDocs, setOtherDocs] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Utility to format Firestore Timestamp or Date to input value
  const fmt = (input: any, withTime = false): string => {
    if (!input) return '';
    const d = typeof input.toDate === 'function' ? input.toDate() : new Date(input);
    if (isNaN(d.getTime())) return '';
    const iso = d.toISOString();
    return withTime ? iso.substr(0, 16) : iso.substr(0, 10);
  };

  // Seed form when editing
  useEffect(() => {
    if (initialData) {
      // Load user info
      getDoc(doc(db, 'users', initialData.userId)).then(snap => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setEmail(d.email || '');
          setFirstName(d.firstName || '');
          setLastName(d.lastName || '');
        }
      });

      setLicenceNumber(initialData.licenceNumber || '');
      setLicenceClass(initialData.licenceClass || '');
      setDateOfBirth(fmt(initialData.dateOfBirth));
      const addr = initialData.address || { street: '', city: '', postalCode: '' };
      setStreet(addr.street);
      setCity(addr.city);
      setPostalCode(addr.postalCode);
      setLearnerPermitExpiry(fmt(initialData.learnerPermitExpiry));
      const em = initialData.emergencyContact || { name: '', relation: '', phone: '' };
      setEmName(em.name);
      setEmRelation(em.relation);
      setEmPhone(em.phone);
      setRoadTestAppointment(fmt(initialData.roadTestAppointment, true));
      setBanned(initialData.banned);
      setBanReason(initialData.banReason || '');
      const prog = initialData.progress || { totalLessons: 0, skillsMastered: [] };
      setTotalLessons(prog.totalLessons);
      setSkillsMastered((prog.skillsMastered || []).join(','));
      const docs = initialData.docs || { licenceCopyUrl: '', permitCopyUrl: '', other: [] };
      setLicenceCopyUrl(docs.licenceCopyUrl);
      setPermitCopyUrl(docs.permitCopyUrl);
      setOtherDocs((docs.other || []).join(','));
    } else {
      // Reset
      setEmail('');
      setFirstName('');
      setLastName('');
      setLicenceNumber('');
      setLicenceClass('');
      setDateOfBirth('');
      setStreet('');
      setCity('');
      setPostalCode('');
      setLearnerPermitExpiry('');
      setEmName('');
      setEmRelation('');
      setEmPhone('');
      setRoadTestAppointment('');
      setBanned(false);
      setBanReason('');
      setTotalLessons(0);
      setSkillsMastered('');
      setLicenceCopyUrl('');
      setPermitCopyUrl('');
      setOtherDocs('');
      setError(null);
    }
  }, [initialData, db]);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      // 1) Resolve or create the user
      const uid = await resolveUserByEmail(db, email, firstName, lastName);

      // 2) Build serviceLocationIds array
      const existing = initialData?.serviceLocationIds || [];
      const serviceLocationIds = Array.from(new Set([...existing, serviceLocationId]));

      // 3) Assemble Client object
      const id = isEdit && initialData ? initialData.id : uuidv4();
      const now = new Date();
      const client: Client = {
        id,
        userId: uid,
        serviceLocationIds,
        licenceNumber,
        licenceClass,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address: { street, city, postalCode },
        learnerPermitExpiry: learnerPermitExpiry ? new Date(learnerPermitExpiry) : undefined,
        emergencyContact: { name: emName, relation: emRelation, phone: emPhone },
        roadTestAppointment: roadTestAppointment ? new Date(roadTestAppointment) : undefined,
        banned,
        banReason: banned ? banReason : undefined,
        progress: {
          totalLessons,
          skillsMastered: skillsMastered
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        docs: {
          licenceCopyUrl,
          permitCopyUrl,
          other: otherDocs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        // Let the store handle timestamps on save
      };

      // 4) Persist via abstraction layer
      await clientStore.save(client);

      onSave(client);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save client');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Edit Client' : 'Add Client'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Name & Email */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="First Name"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Last Name"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          {/* Licence */}
          <Grid item xs={6}>
            <TextField
              label="Licence Number"
              fullWidth
              value={licenceNumber}
              onChange={(e) => setLicenceNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Licence Class"
              fullWidth
              value={licenceClass}
              onChange={(e) => setLicenceClass(e.target.value)}
            />
          </Grid>
          {/* Date of Birth & Permit Expiry */}
          <Grid item xs={6}>
            <TextField
              label="Date of Birth"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Learner Permit Expiry"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={learnerPermitExpiry}
              onChange={(e) => setLearnerPermitExpiry(e.target.value)}
            />
          </Grid>
          {/* Address */}
          <Grid item xs={4}>
            <TextField
              label="Street"
              fullWidth
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="City"
              fullWidth
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Postal Code"
              fullWidth
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </Grid>
          {/* Emergency Contact */}
          <Grid item xs={4}>
            <TextField
              label="Emergency Name"
              fullWidth
              value={emName}
              onChange={(e) => setEmName(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Emergency Relation"
              fullWidth
              value={emRelation}
              onChange={(e) => setEmRelation(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Emergency Phone"
              fullWidth
              value={emPhone}
              onChange={(e) => setEmPhone(e.target.value)}
            />
          </Grid>
          {/* Road Test */}
          <Grid item xs={6}>
            <TextField
              label="Road Test Appointment"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={roadTestAppointment}
              onChange={(e) => setRoadTestAppointment(e.target.value)}
            />
          </Grid>
          {/* Ban */}
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={banned}
                  onChange={(e) => setBanned(e.target.checked)}
                />
              }
              label="Banned"
            />
            {banned && (
              <TextField
                label="Ban Reason"
                fullWidth
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            )}
          </Grid>
          {/* Progress */}
          <Grid item xs={6}>
            <TextField
              label="Total Lessons"
              type="number"
              fullWidth
              value={totalLessons}
              onChange={(e) =>
                setTotalLessons(parseInt(e.target.value, 10) || 0)
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Skills Mastered (comma-separated)"
              fullWidth
              value={skillsMastered}
              onChange={(e) => setSkillsMastered(e.target.value)}
            />
          </Grid>
          {/* Documents */}
          <Grid item xs={4}>
            <TextField
              label="Licence Copy URL"
              fullWidth
              value={licenceCopyUrl}
              onChange={(e) => setLicenceCopyUrl(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Permit Copy URL"
              fullWidth
              value={permitCopyUrl}
              onChange={(e) => setPermitCopyUrl(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Other Docs (comma-separated)"
              fullWidth
              value={otherDocs}
              onChange={(e) => setOtherDocs(e.target.value)}
            />
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
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
