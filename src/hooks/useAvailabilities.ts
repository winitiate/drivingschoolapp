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
 * - If `selectedProvider !== "any"`, listens only to the single provider’s availability.
 * - If `selectedProvider === "any"`, listens to *all* availability docs (for every provider).
 *
 * Whenever the underlying Firestore collection changes (add/update/delete),
 * `availabilities` is updated and `loading` is set to false.
 *
 * @param selectedProvider   – The provider ID to fetch availability for, or "any" to fetch all providers
 * @param availabilityStore  – FirestoreAvailabilityStore instance (included for dependency tracking)
 * @param providers          – The full list of providers (each with at least an `id` field)
 */
export function useAvailabilities(
  selectedProvider: string,
  availabilityStore: any,
  providers: { id: string }[]
) {
  const [availabilities, setAvailabilities] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If there’s no selectedProvider or providers list is empty, clear out and stop loading
    if (!selectedProvider || providers.length === 0) {
      setAvailabilities([]);
      setLoading(false);
      return;
    }

    // Case 1: “Any” means we want *all* availability documents, regardless of provider.
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
              // If there are nested Timestamp fields in ProviderAvailability,
              // you can convert them here, for example:
              //   startDate: data.startDate.toDate(),
              //   endDate: data.endDate.toDate(),
            };
          });
          setAvailabilities(docs);
          setLoading(false);
        }
      );
      return () => {
        unsubscribeAll();
      };
    }

    // Case 2: A specific provider was selected.
    // Only listen to availability docs where scopeId == selectedProvider.
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
            // Convert any Timestamp fields here if needed.
          };
        });
        setAvailabilities(docs);
        setLoading(false);
      }
    );
    return () => {
      unsubscribeOne();
    };
  }, [selectedProvider, availabilityStore, providers]);

  return { availabilities, loading };
}
