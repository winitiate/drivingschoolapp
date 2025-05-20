// src/pages/ServiceLocation/Settings/ServiceLocationAdminSettings/ServiceLocationAdminSettings.tsx

/**
 * ServiceLocationAdminSettings.tsx
 *
 * Admin interface for managing the list of additional
 * administrators for a specific service location.
 * Uses the ServiceLocationStore abstraction to load and save.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

import { ServiceLocation } from '../../../../models/ServiceLocation';
import { ServiceLocationStore } from '../../../../data/ServiceLocationStore';
import { FirestoreServiceLocationStore } from '../../../../data/FirestoreServiceLocationStore';

export default function ServiceLocationAdminSettings() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const store: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );
  const db = getFirestore();

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current service location and its adminIds
  const load = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await store.getById(serviceLocationId);
      if (!loc) {
        throw new Error('Service location not found');
      }
      setLocation(loc);
      setAdminIds(loc.adminIds || []);

      // Resolve adminIds → emails
      const emails: string[] = [];
      for (const uid of loc.adminIds || []) {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.email) emails.push(data.email);
        }
      }
      setAdminEmails(emails);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId, store, db]);

  useEffect(() => {
    load();
  }, [load]);

  // Resolve an email to a userId
  const resolveEmailToUid = async (email: string): Promise<string | null> => {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.trim().toLowerCase())
    );
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    return snaps.docs[0].id;
  };

  // Add a new admin by email
  const handleAdd = async () => {
    setError(null);
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setSaving(true);
    try {
      const uid = await resolveEmailToUid(email);
      if (!uid) {
        throw new Error(`No user found with email ${email}`);
      }
      if (adminIds.includes(uid)) {
        throw new Error('User is already an admin');
      }
      const updatedIds = [...adminIds, uid];
      await store.save({ ...(location as ServiceLocation), adminIds: updatedIds });
      setAdminIds(updatedIds);
      setAdminEmails([...adminEmails, email]);
      setNewEmail('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Remove an admin by index
  const handleRemove = async (index: number) => {
    setError(null);
    setSaving(true);
    try {
      const updatedIds = adminIds.filter((_, i) => i !== index);
      await store.save({ ...(location as ServiceLocation), adminIds: updatedIds });
      setAdminIds(updatedIds);
      setAdminEmails(adminEmails.filter((_, i) => i !== index));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Admin Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="New Admin Email"
          type="email"
          fullWidth
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={saving}
        >
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </Box>

      <List>
        {adminEmails.map((email, idx) => (
          <ListItem
            key={idx}
            secondaryAction={
              <IconButton onClick={() => handleRemove(idx)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            {email}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
