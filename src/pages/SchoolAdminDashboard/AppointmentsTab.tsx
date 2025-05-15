import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import AppointmentFormDialog from '../../components/Appointments/AppointmentFormDialog';
import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import { FirestoreAppointmentStore } from '../../data/FirestoreAppointmentStore';
import { FirestoreStudentDriverStore } from '../../data/FirestoreStudentDriverStore';
import { FirestoreInstructorStore } from '../../data/FirestoreInstructorStore';
import { Appointment } from '../../models/Appointment';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function AppointmentsTab() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const appointmentStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const studentStore = useMemo(() => new FirestoreStudentDriverStore(), []);
  const instructorStore = useMemo(() => new FirestoreInstructorStore(), []);
  const db = useMemo(() => getFirestore(), []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const reload = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      console.log('Loading data for schoolId:', schoolId);

      const [appointmentList, studentList, instructorList] = await Promise.all([
        appointmentStore.listBySchool(schoolId),
        studentStore.listBySchool(schoolId),
        instructorStore.listBySchool(schoolId),
      ]);

      console.log('Appointments Found:', appointmentList);
      console.log('Students Found:', studentList);
      console.log('Instructors Found:', instructorList);

      const studentListWithNames: { id: string; name: string }[] = [];
      for (const stu of studentList) {
        try {
          const snap = await getDoc(doc(db, 'users', stu.userId));
          const data = snap.exists() ? snap.data() : {};
          studentListWithNames.push({ id: stu.id, name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed Student' });
        } catch (err) {
          console.error('Error fetching user for studentId:', stu.userId, err);
          studentListWithNames.push({ id: stu.id, name: 'Unnamed Student' });
        }
      }

      const instructorListWithNames: { id: string; name: string }[] = [];
      for (const instr of instructorList) {
        try {
          const snap = await getDoc(doc(db, 'users', instr.userId));
          const data = snap.exists() ? snap.data() : {};
          instructorListWithNames.push({ id: instr.id, name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unnamed Instructor' });
        } catch (err) {
          console.error('Error fetching user for instructorId:', instr.userId, err);
          instructorListWithNames.push({ id: instr.id, name: 'Unnamed Instructor' });
        }
      }

      setAppointments(appointmentList);
      setStudents(studentListWithNames);
      setInstructors(instructorListWithNames);

    } catch (e: any) {
      console.error('Reload Error:', e);
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [appointmentStore, studentStore, instructorStore, schoolId, db]);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async (data: Partial<Appointment>) => {
    if (!schoolId) return;
    try {
      const base = editing || { schoolIds: [] as string[] } as Appointment;
      const newIds = Array.from(new Set([...(base.schoolIds || []), schoolId]));
      const appointment = { ...(base.id ? base : data as Appointment), ...data, schoolIds: newIds };
      await appointmentStore.save(appointment);
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Appointments</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          Add Appointment
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : appointments.length === 0 ? (
        <Typography>No appointments found for this school.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={appointment => { setEditing(appointment); setDialogOpen(true); }}
        />
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        schoolId={schoolId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        students={students}
        instructors={instructors}
      />
    </Box>
  );
}
