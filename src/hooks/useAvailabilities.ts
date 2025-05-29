import { useEffect, useState } from "react";
import type { Availability } from "../models/Availability";
import type { FirestoreAvailabilityStore } from "../data/FirestoreAvailabilityStore";

export function useAvailabilities(
  selectedProvider: string,
  availabilityStore: FirestoreAvailabilityStore
) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedProvider) return;
    setLoading(true);

    const loader =
      selectedProvider === "any"
        ? availabilityStore
            .listAll()
            .then((all) => all.filter((a) => a.scope === "provider"))
        : availabilityStore
            .getByScope("provider", selectedProvider)
            .then((a) => (a ? [a] : []));

    loader
      .then(setAvailabilities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProvider, availabilityStore]);

  return { availabilities, loading };
}
