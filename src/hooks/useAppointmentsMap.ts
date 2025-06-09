import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import dayjs from "dayjs";
import { db } from "../firebase";
import type { Appointment } from "../models/Appointment";
import type { FirestoreAppointmentStore } from "../data/FirestoreAppointmentStore";

/**
 * Builds and maintains a real‐time Map<string, Appointment[]> keyed by YYYY-MM-DD.
 * Accepts `next30` as an array of either Dayjs or ISO‐format strings.
 */
export function useAppointmentsMap(
  providers: { id: string; name?: string }[],
  selectedProvider: string,
  apptStore: FirestoreAppointmentStore,
  locId: string,
  next30: (string | dayjs.Dayjs)[]
) {
  const [apptsByDate, setApptsByDate] = useState<Map<string, Appointment[]>>(new Map());

  useEffect(() => {
    if (!locId || providers.length === 0) {
      setApptsByDate(new Map());
      return;
    }

    // Normalize next30 into plain date strings
    const dateKeys = next30.map((d) =>
      typeof d === "string" ? d : d.format("YYYY-MM-DD")
    );

    // Base query: all appointments at this location
    let q = query(
      collection(db, "appointments"),
      where("serviceLocationId", "==", locId)
    );

    // If filtering by provider:
    if (selectedProvider !== "any") {
      q = query(q, where("serviceProviderIds", "array-contains", selectedProvider));
    }

    // Listen for real‐time updates
    const unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      // Convert to Appointment[] and fix Timestamps
      const all: Appointment[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startTime:
            data.startTime instanceof Timestamp
              ? data.startTime.toDate()
              : new Date(data.startTime as string),
          endTime:
            data.endTime instanceof Timestamp
              ? data.endTime.toDate()
              : new Date(data.endTime as string),
        } as Appointment;
      });

      // Build the map
      const map = new Map<string, Appointment[]>();
      all.forEach((appt) => {
        const key = dayjs(appt.startTime).format("YYYY-MM-DD");
        if (dateKeys.includes(key)) {
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(appt);
        }
      });

      setApptsByDate(map);
    });

    return () => {
      unsub();
    };
  }, [
    // include providers’ IDs so if your list changes it reloads
    providers.map((p) => p.id).join(","),
    selectedProvider,
    locId,
    // stringify dateKeys so changing only the dates triggers reload
    next30.map((d) => (typeof d === "string" ? d : d.format("YYYY-MM-DD"))).join(","),
  ]);

  return apptsByDate;
}
