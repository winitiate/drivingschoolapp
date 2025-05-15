// src/components/Students/StudentFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Button, Checkbox, FormControlLabel, Alert
} from '@mui/material';
import { Student } from '../../models/Student';
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
  firstName: string,
  lastName: string
): Promise<string> {
  const usersCol = collection(db, 'users');
  const snap = await getDocs(
    query(usersCol, where('email', '==', email.trim().toLowerCase()))
  );
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  const uid = uuidv4();
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: email.trim().toLowerCase(),
    firstName,
    lastName,
    roles: ['student'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return uid;
}

interface Props {
  open: boolean;
  schoolId: string;
  initialData?: Student;
  onClose: () => void;
  onSave: (student: Partial<Student>) => void;
}

export default function StudentFormDialog({
  open,
  schoolId,
  initialData,
  onClose,
  onSave
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  // Controlled form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const [error, setError] = useState<string|null>(null);
  const [busy, setBusy] = useState(false);

  // Format existing timestamp/date to input-friendly string
  const fmt = (input: any, withTime = false): string => {
    if (!input) return '';
    const d = typeof input.toDate === 'function' ? input.toDate() : new Date(input);
    if (isNaN(d.getTime())) return '';
    const iso = d.toISOString();
    return withTime ? iso.substr(0, 16) : iso.substr(0, 10);
  };

  // Seed form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Load user profile
      getDoc(doc(db, 'users', initialData.userId)).then(snap => {
        if (snap.exists()) {
          const d: any = snap.data();
          setEmail(d.email || '');
          setFirstName(d.firstName || '');
          setLastName(d.lastName || '');
        }
      });

      setLicenceNumber(initialData.licenceNumber);
      setLicenceClass(initialData.licenceClass);
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
      // Reset all
      setEmail(''); setFirstName(''); setLastName('');
      setLicenceNumber(''); setLicenceClass('');
      setDateOfBirth(''); setStreet(''); setCity(''); setPostalCode('');
      setLearnerPermitExpiry(''); setEmName(''); setEmRelation(''); setEmPhone('');
      setRoadTestAppointment(''); setBanned(false); setBanReason('');
      setTotalLessons(0); setSkillsMastered('');
      setLicenceCopyUrl(''); setPermitCopyUrl(''); setOtherDocs('');
    }
  }, [initialData, db]);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      // Resolve or create user
      const uid = await resolveUserByEmail(db, email, firstName, lastName);

      // Also update user's first/last name on edit (or always, to keep names in sync)
      await setDoc(
        doc(db, 'users', uid),
        { firstName, lastName, updatedAt: serverTimestamp() },
        { merge: true }
      );

      // Build schoolIds array
      const existing = initialData?.schoolIds || [];
      const schoolIds = Array.from(new Set([...existing, schoolId]));

      // Base payload
      const id = isEdit && initialData ? initialData.id : uuidv4();
      const ts = serverTimestamp();
      const payload: any = {
        id,
        userId: uid,
        schoolIds,
        updatedAt: ts,
        ...(isEdit ? {} : { createdAt: ts })
      };

      // Conditionally include fields
      if (licenceNumber) payload.licenceNumber = licenceNumber;
      if (licenceClass) payload.licenceClass = licenceClass;
      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth);
      payload.address = { street, city, postalCode };
      if (learnerPermitExpiry) payload.learnerPermitExpiry = new Date(learnerPermitExpiry);
      payload.emergencyContact = { name: emName, relation: emRelation, phone: emPhone };
      if (roadTestAppointment) payload.roadTestAppointment = new Date(roadTestAppointment);

      payload.banned = banned;
      if (banned && banReason) payload.banReason = banReason;

      payload.progress = { totalLessons };
      if (skillsMastered) {
        payload.progress.skillsMastered = skillsMastered
          .split(',').map(s => s.trim()).filter(Boolean);
      }

      payload.docs = {};
      if (licenceCopyUrl) payload.docs.licenceCopyUrl = licenceCopyUrl;
      if (permitCopyUrl) payload.docs.permitCopyUrl = permitCopyUrl;
      if (otherDocs) {
        payload.docs.other = otherDocs
          .split(',').map(s => s.trim()).filter(Boolean);
      }

      // Save to Firestore
      await setDoc(doc(db, 'students', payload.id), payload, { merge: true });

      onSave(payload);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Edit Student' : 'Add Student'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* First / Last / Email */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="First Name"
              fullWidth
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Last Name"
              fullWidth
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Grid>
          {/* Licence */}
          <Grid item xs={6}>
            <TextField
              label="Licence Number"
              fullWidth
              value={licenceNumber}
              onChange={e => setLicenceNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Licence Class"
              fullWidth
              value={licenceClass}
              onChange={e => setLicenceClass(e.target.value)}
            />
          </Grid>
          {/* Date of Birth */}
          <Grid item xs={6}>
            <TextField
              label="Date of Birth" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />
          </Grid>
          {/* Permit Expiry */}
          <Grid item xs={6}>
            <TextField
              label="Learner Permit Expiry" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={learnerPermitExpiry}
              onChange={e => setLearnerPermitExpiry(e.target.value)}
            />
          </Grid>
          {/* Address */}
          <Grid item xs={4}>
            <TextField label="Street" fullWidth value={street} onChange={e => setStreet(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="City" fullWidth value={city} onChange={e => setCity(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Postal Code" fullWidth value={postalCode} onChange={e => setPostalCode(e.target.value)} />
          </Grid>
          {/* Emergency Contact */}
          <Grid item xs={4}>
            <TextField label="Emergency Name" fullWidth value={emName} onChange={e => setEmName(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Emergency Relation" fullWidth value={emRelation} onChange={e => setEmRelation(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Emergency Phone" fullWidth value={emPhone} onChange={e => setEmPhone(e.target.value)} />
          </Grid>
          {/* Road Test */}
          <Grid item xs={6}>
            <TextField
              label="Road Test Appointment"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={roadTestAppointment}
              onChange={e => setRoadTestAppointment(e.target.value)}
            />
          </Grid>
          {/* Ban */}
          <Grid item xs={6}>
            <FormControlLabel
              control={<Checkbox checked={banned} onChange={e => setBanned(e.target.checked)} />}
              label="Banned"
            />
            {banned && (
              <TextField label="Ban Reason" fullWidth value={banReason} onChange={e => setBanReason(e.target.value)} />
            )}
          </Grid>
          {/* Progress */}
          <Grid item xs={6}>
            <TextField
              label="Total Lessons" type="number" fullWidth
              value={totalLessons}
              onChange={e => setTotalLessons(parseInt(e.target.value, 10) || 0)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Skills Mastered (comma-separated)"
              fullWidth
              value={skillsMastered}
              onChange={e => setSkillsMastered(e.target.value)}
            />
          </Grid>
          {/* Docs */}
          <Grid item xs={4}>
            <TextField
              label="Licence Copy URL"
              fullWidth
              value={licenceCopyUrl}
              onChange={e => setLicenceCopyUrl(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Permit Copy URL"
              fullWidth
              value={permitCopyUrl}
              onChange={e => setPermitCopyUrl(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Other Docs (comma-separated)"
              fullWidth
              value={otherDocs}
              onChange={e => setOtherDocs(e.target.value)}
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
