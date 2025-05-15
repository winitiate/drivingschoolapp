import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { Appointment } from '../../models/Appointment';

interface AppointmentFormDialogProps {
  open: boolean;
  schoolId: string;
  initialData?: Appointment;
  onClose: () => void;
  onSave: (appointment: Partial<Appointment>) => void;
  students: { id: string; name: string }[];
  instructors: { id: string; name: string }[];
}

export default function AppointmentFormDialog({
  open,
  schoolId,
  initialData,
  onClose,
  onSave,
  students,
  instructors,
}: AppointmentFormDialogProps) {
  const [studentId, setStudentId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (initialData) {
      setStudentId(initialData.studentId || '');
      setInstructorId(initialData.instructorId || '');
      setDate(initialData.date || '');
      setTime(initialData.time || '');
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSave({
      ...initialData,
      studentId,
      instructorId,
      date,
      time,
    });
  };

  const selectedStudent = students.find(s => s.id === studentId) || null;
  const selectedInstructor = instructors.find(i => i.id === instructorId) || null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? 'Edit Appointment' : 'Add Appointment'}</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={students}
          getOptionLabel={(option) => option.name}
          value={selectedStudent}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onChange={(_, newValue) => setStudentId(newValue?.id || '')}
          renderInput={(params) => <TextField {...params} label="Student" margin="normal" fullWidth />}
        />

        <Autocomplete
          options={instructors}
          getOptionLabel={(option) => option.name}
          value={selectedInstructor}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onChange={(_, newValue) => setInstructorId(newValue?.id || '')}
          renderInput={(params) => <TextField {...params} label="Instructor" margin="normal" fullWidth />}
        />

        <TextField
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
