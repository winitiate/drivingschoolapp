import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Button, Alert
} from '@mui/material';
import { Instructor } from '../../models/Instructor';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
      roles: ['instructor'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return uid;
  }
}

interface Props {
  open: boolean;
  schoolId: string;
  initialData?: Instructor;
  onClose: () => void;
  onSave: (inst: Partial<Instructor>) => void;
}

export default function InstructorFormDialog({
  open,
  schoolId,
  initialData,
  onClose,
  onSave
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = useState<Partial<Instructor>>({
    id: undefined,
    userId: '',
    licenceNumber: '',
    licenceClass: '',
    address: { street: '', city: '', postalCode: '' },
    backgroundCheck: { date: new Date(), status: 'pending' },
    rating: { average: 0, reviewCount: 0 },
    availability: [],
    blockedTimes: [],
    vehiclesCertifiedFor: [],
    schoolIds: [],
  });

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string|null>(null);
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
        licenceNumber: '',
        licenceClass: '',
        address: { street: '', city: '', postalCode: '' },
        backgroundCheck: { date: new Date(), status: 'pending' },
        rating: { average: 0, reviewCount: 0 },
        availability: [],
        blockedTimes: [],
        vehiclesCertifiedFor: [],
        schoolIds: [],
      });
      setEmail('');
      setFirstName('');
      setLastName('');
    }
  }, [initialData, db]);

  const handleChange = <K extends keyof Instructor>(key: K, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };
  const handleAddress = <K extends keyof Instructor['address']>(key: K, value: any) => {
    setForm(f => ({ 
      ...f, 
      address: { ...(f.address as any), [key]: value }
    }));
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const uid = await resolveUserByEmail(db, email, firstName, lastName);
      const id = isEdit ? form.id! : uuidv4();
      const ts = serverTimestamp();

      // Add this schoolId to the list
      const existingSchoolIds = form.schoolIds || [];
      const newSchoolIds = Array.from(new Set([...existingSchoolIds, schoolId]));

      const instr: Partial<Instructor> = {
        ...form,
        id,
        userId: uid,
        schoolIds: newSchoolIds,
        updatedAt: ts,
        ...(isEdit ? {} : { createdAt: ts }),
      };

      await setDoc(doc(db, 'instructors', id), instr, { merge: true });
      onSave(instr);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Instructor' : 'Add Instructor'}</DialogTitle>
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
              label="Licence Number"
              fullWidth
              value={form.licenceNumber || ''}
              onChange={e => handleChange('licenceNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Licence Class"
              fullWidth
              value={form.licenceClass || ''}
              onChange={e => handleChange('licenceClass', e.target.value)}
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
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
