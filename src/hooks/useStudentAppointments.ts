// src/hooks/useStudentAppointments.ts
import { useState, useEffect } from 'react';
import { appointmentStore } from '../data';
import type { Appointment } from '../models/Appointment';

export function useStudentAppointments(studentUid: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentUid) return;
    (async () => {
      setLoading(true);
      const appts = await appointmentStore.listByStudent(studentUid);
      setAppointments(appts);
      setLoading(false);
    })();
  }, [studentUid]);

  return { appointments, loading };
}
