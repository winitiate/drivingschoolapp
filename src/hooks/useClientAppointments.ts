// src/hooks/useClientAppointments.ts

/**
 * useClientAppointments.ts
 *
 * Custom React hook to fetch appointments for a specific client.
 * Wraps appointmentStore.listByClient to load upcoming appointments,
 * and provides loading and error states.
 */

import { useState, useEffect } from 'react';
import { appointmentStore } from '../data';
import type { Appointment } from '../models/Appointment';

export function useClientAppointments(clientUid: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clientUid) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const appts = await appointmentStore.listByClient(clientUid);
        setAppointments(appts);
      } catch (err: any) {
        console.error('Failed to load appointments:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientUid]);

  return { appointments, loading, error };
}
