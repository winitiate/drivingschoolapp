import { useEffect, useState } from "react";
import dayjs from "dayjs";
import type { Appointment } from "../models/Appointment";
import type { FirestoreAppointmentStore } from "../data/FirestoreAppointmentStore";

export function useAppointmentsMap(
  providers: { id: string }[],
  selectedProvider: string,
  apptStore: FirestoreAppointmentStore,
  locId: string,
  next30: dayjs.Dayjs[]
) {
  const [apptsByDate, setApptsByDate] = useState<
    Map<string, Appointment[]>
  >(new Map());

  useEffect(() => {
    if (providers.length === 0) return;

    (async () => {
      let appts: Appointment[] = [];
      if (selectedProvider === "any") {
        const lists = await Promise.all(
          providers.map((p) => apptStore.listByServiceProvider(p.id))
        );
        appts = lists.flat();
      } else {
        appts = await apptStore.listByServiceProvider(selectedProvider);
      }

      const filtered = appts.filter(
        (a) =>
          a.serviceLocationId === locId &&
          a.startTime &&
          next30.some(
            (d) => d.format("YYYY-MM-DD") === dayjs(a.startTime).format("YYYY-MM-DD")
          )
      );

      const map = new Map<string, Appointment[]>();
      filtered.forEach((a) => {
        const iso = dayjs(a.startTime).format("YYYY-MM-DD");
        const list = map.get(iso) ?? [];
        list.push(a);
        map.set(iso, list);
      });
      setApptsByDate(map);
    })();
  }, [providers, selectedProvider, apptStore, locId, next30]);

  return apptsByDate;
}
