// src/hooks/useClientAppointments.ts

import { useState, useEffect } from 'react';
import { FirestoreClientStore } from '../data/FirestoreClientStore';
import { appointmentStore } from '../data';
import type { Appointment } from '../models/Appointment';

/**
 * Fetches appointments for the logged‐in client (by UID) 
 * at a specific location, returning loading/error states.
 * Passing in `refreshFlag` forces a reload whenever it changes.
 */
export function useClientAppointments(
  clientUid: string,
  serviceLocationId: string,
  refreshFlag: number
) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    if (!clientUid || !serviceLocationId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Find the Client doc for this user UID
        const clientStore = new FirestoreClientStore();
        const allClients = await clientStore.listByServiceLocation(serviceLocationId);
        const client = allClients.find(c => c.userId === clientUid);
        if (!client) {
          if (!cancelled) setAppointments([]);
          return;
        }

        // 2) Load all appointments and filter
        const all = await appointmentStore.listAll();
        const mine = all.filter(a =>
          a.clientId === client.id &&
          Array.isArray(a.serviceLocationIds) &&
          a.serviceLocationIds.includes(serviceLocationId)
        );

        if (!cancelled) setAppointments(mine);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load appointments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientUid, serviceLocationId, refreshFlag]);

  return { appointments, loading, error };
}
