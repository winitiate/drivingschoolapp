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

/**
 * Custom hook to fetch “availability” documents from Firestore in real time.
 *
 * - If `selectedProvider !== "any"`, listens only to that provider’s availability.
 * - If `selectedProvider === "any"`, listens to *all* availability docs.
 */
export function useAvailabilities(
  selectedProvider: string,
  availabilityStore: any,
  providers: { id: string }[]  // only used to guard initial call
) {
  const [availabilities, setAvailabilities] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Guard: if no valid provider selected or providers list empty, clear and stop
    if (!selectedProvider || providers.length === 0) {
      setAvailabilities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: () => void;

    if (selectedProvider === "any") {
      const collRef = collection(db, "availabilities");
      unsubscribe = onSnapshot(
        collRef,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const docs = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as ProviderAvailability),
            id: docSnap.id,
          }));
          setAvailabilities(docs);
          setLoading(false);
        }
      );
    } else {
      const q = query(
        collection(db, "availabilities"),
        where("scopeId", "==", selectedProvider)
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const docs = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as ProviderAvailability),
            id: docSnap.id,
          }));
          setAvailabilities(docs);
          setLoading(false);
        }
      );
    }

    // Cleanup listener on unmount or provider change
    return () => unsubscribe();
  }, [selectedProvider]);  // only re-run when selectedProvider changes

  return { availabilities, loading };
}
