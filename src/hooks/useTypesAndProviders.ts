import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import type { FirestoreServiceProviderStore } from "../data/FirestoreServiceProviderStore";
import type { FirestoreAppointmentTypeStore } from "../data/FirestoreAppointmentTypeStore";

/** Fetches provider + type lists for a service-location, returns loading / error */
export function useTypesAndProviders(
  locId: string,
  providerStore: FirestoreServiceProviderStore,
  typeStore: FirestoreAppointmentTypeStore
) {
  const db = getFirestore();

  const [types, setTypes] = useState<{ id: string; title: string }[]>([]);
  const [providers, setProviders] = useState<
    { id: string; name: string; maxSimultaneousClients: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      providerStore.listByServiceLocation(locId),
      typeStore.listByServiceLocation(locId),
    ])
      .then(async ([provList, typeList]) => {
        const provs = await Promise.all(
          provList.map(async (p) => {
            const snap = await getDoc(doc(db, "users", p.userId));
            const u = snap.exists() ? (snap.data() as any) : {};
            const name =
              `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
            const ent = await providerStore.getById(p.id!);
            return {
              id: p.id!,
              name,
              maxSimultaneousClients: ent?.maxSimultaneousClients ?? Infinity,
            };
          })
        );
        setProviders(provs);
        setTypes(typeList.map((t) => ({ id: t.id!, title: t.title })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [locId, providerStore, typeStore, db]);

  return { types, providers, loading, error };
}
