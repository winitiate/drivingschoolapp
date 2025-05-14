// src/hooks/useStudentAppointments.ts
import { useState, useEffect } from 'react';
import { appointmentStore } from '../data';
import type { Appointment } from '../models/Appointment';

export function useStudentAppointments(studentUid: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentUid) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const appts = await appointmentStore.listByStudent(studentUid);
        setAppointments(appts);
      } catch (err: any) {
        console.error('Failed to load appointments:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentUid]);

  return { appointments, loading, error };
}
