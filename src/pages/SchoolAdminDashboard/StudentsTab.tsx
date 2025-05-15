import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import StudentFormDialog from '../../components/Students/StudentFormDialog';
import StudentsTable, { StudentsTableProps } from '../../components/Students/StudentsTable';
import { FirestoreStudentDriverStore } from '../../data/FirestoreStudentDriverStore';
import { Student } from '../../models/Student';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function StudentsTab() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const store = useMemo(() => new FirestoreStudentDriverStore(), []);
  const db = useMemo(() => getFirestore(), []);

  const [students, setStudents] = useState<Student[]>([]);
  const [usersMap, setUsersMap] = useState<StudentsTableProps['usersMap']>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student|null>(null);

  const reload = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      // fetch this school's students
      const list = await store.listBySchool(schoolId);
      setStudents(list);

      // build usersMap
      const map: StudentsTableProps['usersMap'] = {};
      await Promise.all(
        list.map(async stu => {
          if (!map[stu.userId]) {
            const snap = await getDoc(doc(db, 'users', stu.userId));
            const d = snap.exists() ? snap.data() as any : {};
            map[stu.userId] = {
              firstName: d.firstName || '',
              lastName:  d.lastName  || '',
              email:     d.email     || ''
            };
          }
        })
      );
      setUsersMap(map);
    } catch (e: any) {
      setError(e.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [store, db, schoolId]);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async (data: Partial<Student>) => {
    if (!schoolId) return;
    try {
      // merge schoolIds array
      const base = editing || { schoolIds: [] as string[] } as Student;
      const newIds = Array.from(new Set([...(base.schoolIds||[]), schoolId]));
      const stu = { ...(base.id? base : data as Student), ...data, schoolIds: newIds };
      await store.save(stu);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Students</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          Add Student
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        <StudentsTable
          students={students}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={stu => { setEditing(stu); setDialogOpen(true); }}
        />
      )}

      <StudentFormDialog
        open={dialogOpen}
        schoolId={schoolId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
}
