// src/pages/SuperAdmin/ManageBusinesses.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions
} from '@mui/material';
import { businessStore } from '../../data';
import { Business } from '../../models/Business';
import { db } from '../../firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';

export default function ManageBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Business | null>(null);

  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await businessStore.listAll();
      setBusinesses(all);
    } catch (e: any) {
      setError(e.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPhone('');
    setDialogOpen(true);
  };

  const openEdit = (biz: Business) => {
    setEditing(biz);
    setName(biz.name);
    setEmail(biz.email || '');
    setPhone(biz.phone || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError(null);

    // Title is required
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // **Ensure createdAt is a JS Date** (not a Firestore Timestamp)
    let createdAtDate: Date;
    if (editing) {
      const raw = editing.createdAt as any;
      if (raw instanceof Date) {
        createdAtDate = raw;
      } else if (raw && typeof raw.toDate === 'function') {
        createdAtDate = raw.toDate();
      } else {
        createdAtDate = new Date();
      }
    } else {
      createdAtDate = new Date();
    }

    // Build the payload
    const baseData = {
      name:      name.trim(),
      email:     email.trim() || undefined,
      phone:     phone.trim() || undefined,
      createdAt: createdAtDate,
      updatedAt: new Date(),
      createdBy: editing?.createdBy || '',
      updatedBy: editing?.updatedBy || '',
      status:    editing?.status || 'active'
    };

    try {
      let bizId: string;

      if (editing?.id) {
        // Update existing business
        await businessStore.save({ id: editing.id, ...baseData });
        bizId = editing.id;
      } else {
        // Create new business and capture its ID
        const ref = doc(collection(db, 'businesses'));
        await setDoc(ref, {
          ...baseData,
          createdAt:  serverTimestamp(),
          updatedAt:  serverTimestamp()
        });
        bizId = ref.id;
      }

      // Link any user(s) with this email to the new/updated business
      if (email.trim()) {
        const usersQ = query(
          collection(db, 'users'),
          where('email', '==', email.trim())
        );
        const snaps = await getDocs(usersQ);
        for (const userSnap of snaps.docs) {
          await updateDoc(userSnap.ref, {
            roles:      ['business'],
            businessId: bizId,
            updatedAt:  serverTimestamp()
          });
        }
      }

      setDialogOpen(false);
      reload();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Manage Businesses</Typography>
        <Button variant="contained" onClick={openNew}>
          New Business
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businesses.map(biz => (
              <TableRow key={biz.id}>
                <TableCell>{biz.name}</TableCell>
                <TableCell>{biz.email}</TableCell>
                <TableCell>{biz.phone}</TableCell>
                <TableCell align="center">
                  <Button size="small" onClick={() => openEdit(biz)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit Business' : 'New Business'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            required
            margin="normal"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            label="Phone"
            fullWidth
            margin="normal"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
