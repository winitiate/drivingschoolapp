// src/hooks/useAvailabilities.ts

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import type { ProviderAvailability } from "../models/Availability";

interface UseAvailabilitiesParams {
  selectedProvider: string;
  availabilityStore: any;
  providers: { id: string }[];
}

/**
 * Custom hook to fetch “availability” documents from Firestore in real time.
 *
 * - If `selectedProvider !== "any"`, listens only to that provider’s availability.
 * - If `selectedProvider === "any"`, listens to *all* availability docs.
 */
export function useAvailabilities(
  selectedProvider: string,
  availabilityStore: any,
  providers: { id: string }[]                 // still required
) {
  const [availabilities, setAvailabilities] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Guard: if no provider selected *or* providers list is missing/empty, clear & stop
    if (
      !selectedProvider ||
      !Array.isArray(providers) ||
      providers.length === 0
    ) {
      setAvailabilities([]);
      setLoading(false);
      return;
    }

    // Case: “any” → listen to *all* availabilities
    if (selectedProvider === "any") {
      const collRef = collection(db, "availabilities");
      const unsubscribeAll = onSnapshot(
        collRef,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const docs: ProviderAvailability[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as ProviderAvailability;
            return {
              ...data,
              id: docSnap.id,
            };
          });
          setAvailabilities(docs);
          setLoading(false);
        }
      );
      return () => unsubscribeAll();
    }

    // Case: specific provider → listen only to that provider’s docs
    const q = query(
      collection(db, "availabilities"),
      where("scopeId", "==", selectedProvider)
    );
    const unsubscribeOne = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs: ProviderAvailability[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as ProviderAvailability;
          return {
            ...data,
            id: docSnap.id,
          };
        });
        setAvailabilities(docs);
        setLoading(false);
      }
    );
    return () => unsubscribeOne();
  }, [selectedProvider, availabilityStore, providers]);

  return { availabilities, loading };
}
