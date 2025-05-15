import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import InstructorFormDialog from '../../components/Instructors/InstructorFormDialog';
import InstructorsTable, { InstructorsTableProps } from '../../components/Instructors/InstructorsTable';
import { FirestoreInstructorStore } from '../../data/FirestoreInstructorStore';
import { Instructor } from '../../models/Instructor';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function InstructorsTab() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const store = useMemo(() => new FirestoreInstructorStore(), []);
  const db = useMemo(() => getFirestore(), []);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [usersMap, setUsersMap] = useState<InstructorsTableProps['usersMap']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Instructor | null>(null);

  const reload = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await store.listBySchool(schoolId);
      setInstructors(list);

      const map: InstructorsTableProps['usersMap'] = {};
      await Promise.all(
        list.map(async inst => {
          if (!map[inst.userId]) {
            const snap = await getDoc(doc(db, 'users', inst.userId));
            const d = snap.exists() ? snap.data() as any : {};
            map[inst.userId] = {
              firstName: d.firstName || '',
              lastName: d.lastName || '',
              email: d.email || ''
            };
          }
        })
      );
      setUsersMap(map);
    } catch (e: any) {
      setError(e.message || 'Failed to load instructors');
    } finally {
      setLoading(false);
    }
  }, [store, db, schoolId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSave = async (data: Partial<Instructor>) => {
    try {
      await store.save(data as Instructor);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Instructors</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          Add Instructor
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <InstructorsTable
          instructors={instructors}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={inst => { setEditing(inst); setDialogOpen(true); }}
        />
      )}

      <InstructorFormDialog
        open={dialogOpen}
        schoolId={schoolId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
