// src/hooks/useAppointmentsMap.ts

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase";
import type { Appointment } from "../models/Appointment";
import type { FirestoreAppointmentStore } from "../data/FirestoreAppointmentStore";

/**
 * Returns a Map keyed by “YYYY-MM-DD” → Appointment[] for all appointments
 * at the given service location in the next 30 days (or beyond). Listens
 * in real time: whenever any appointment is added/updated/deleted,
 * the callback re‐builds the Map and updates state.
 *
 * @param providers         – List of providers belonging to this location
 * @param selectedProvider  – A specific provider ID, or "any"
 * @param apptStore         – FirestoreAppointmentStore instance (included only for dependency tracking)
 * @param locId             – The current service location’s ID
 * @param next30            – Array of Dayjs objects representing the next 30 calendar days
 */
export function useAppointmentsMap(
  providers: { id: string }[],
  selectedProvider: string,
  apptStore: FirestoreAppointmentStore,
  locId: string,
  next30: dayjs.Dayjs[]
) {
  const [apptsByDate, setApptsByDate] = useState<Map<string, Appointment[]>>(new Map());

  useEffect(() => {
    if (!locId || providers.length === 0) {
      setApptsByDate(new Map());
      return;
    }

    // Build a query for all appointments at this location
    const q = query(
      collection(db, "appointments"),
      where("serviceLocationId", "==", locId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Convert each document into an Appointment object,
        // ensuring Timestamps become Date objects if needed
        const allDocs: Appointment[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Appointment;
          return {
            ...data,
            id: docSnap.id,
            startTime:
              typeof (data.startTime as any)?.toDate === "function"
                ? (data.startTime as any).toDate()
                : new Date(data.startTime as string),
            endTime:
              typeof (data.endTime as any)?.toDate === "function"
                ? (data.endTime as any).toDate()
                : new Date(data.endTime as string),
          };
        });

        // Filter by selectedProvider if not "any"
        const filtered =
          selectedProvider === "any"
            ? allDocs
            : allDocs.filter((a) => a.serviceProviderIds.includes(selectedProvider));

        // Further filter to only next30 days
        const dateKeys = next30.map((d) => d.format("YYYY-MM-DD"));
        const next30Filtered = filtered.filter((a) => {
          const dayKey = dayjs(a.startTime).format("YYYY-MM-DD");
          return dateKeys.includes(dayKey);
        });

        // Build a Map keyed by "YYYY-MM-DD" → Appointment[]
        const map = new Map<string, Appointment[]>();
        next30Filtered.forEach((appt) => {
          const dayKey = dayjs(appt.startTime).format("YYYY-MM-DD");
          if (!map.has(dayKey)) {
            map.set(dayKey, []);
          }
          map.get(dayKey)!.push(appt);
        });

        setApptsByDate(map);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [providers, selectedProvider, apptStore, locId, next30]);

  return apptsByDate;
}
