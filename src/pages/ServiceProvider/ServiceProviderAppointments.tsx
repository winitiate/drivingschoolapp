/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/ServiceProvider/ServiceProviderAppointments.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

import AppointmentsTable from "../../components/Appointments/AppointmentsTable";
import AppointmentFormDialog, {
  Option,
} from "../../components/Appointments/AppointmentFormDialog";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";
import { FirestoreClientStore } from "../../data/FirestoreClientStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";

import type { Appointment } from "../../models/Appointment";

export default function ServiceProviderAppointments() {
  const { serviceProviderId } =
    useParams<{ serviceProviderId: string }>();
  const navigate = useNavigate();

  const db = useMemo(() => getFirestore(), []);
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore = useMemo(() => new FirestoreClientStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore = useMemo(
    () => new FirestoreServiceProviderStore(),
    []
  );

  /* ───────── state ───────── */
  const [providerName, setProviderName] = useState("Service Provider");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  /* ───────── 1. provider name ───────── */
  useEffect(() => {
    if (!serviceProviderId) return;
    (async () => {
      const prov = await providerStore.getById(serviceProviderId);
      if (!prov) return;
      const snap = await getDoc(doc(db, "users", prov.userId));
      if (snap.exists()) {
        const u = snap.data() as any;
        setProviderName(
          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
            "Service Provider"
        );
      }
    })();
  }, [serviceProviderId]);

  /* ───────── 2. load / enrich appointments ───────── */
  const reload = useCallback(async () => {
    if (!serviceProviderId) return;

    setLoading(true);
    setError(null);

    try {
      // A) appointments for this provider
      const mine = await apptStore.listByServiceProvider(serviceProviderId);

      // B) unique client IDs (UIDs or Client doc IDs)
      const uniqClientIds = Array.from(
        new Set(mine.flatMap((a) => a.clientIds ?? []))
      );

      const clientOpts: Option[] = await Promise.all(
        uniqClientIds.map(async (cid) => {
          // 1️⃣ try a Client doc
          const cEnt = await clientStore.getById(cid);
          if (cEnt) {
            const snap = await getDoc(doc(db, "users", cEnt.userId));
            if (snap.exists()) {
              const d = snap.data() as any;
              return {
                id: cid,
                label:
                  [d.firstName, d.lastName].filter(Boolean).join(" ") ||
                  "Unnamed Client",
              };
            }
          }

          // 2️⃣ fall back to treating `cid` as a UID in users/{cid}
          const snap = await getDoc(doc(db, "users", cid));
          if (snap.exists()) {
            const d = snap.data() as any;
            return {
              id: cid,
              label:
                [d.firstName, d.lastName].filter(Boolean).join(" ") ||
                "Unnamed Client",
            };
          }

          return { id: cid, label: "Unknown Client" };
        })
      );
      const clientMap = Object.fromEntries(
        clientOpts.map((c) => [c.id, c.label])
      );

      // C) appointment-type map
      const locIds = Array.from(new Set(mine.map((a) => a.serviceLocationId)));
      const typeLists = await Promise.all(
        locIds.map((loc) => typeStore.listByServiceLocation(loc))
      );
      const typeMap = new Map<string, string>();
      typeLists.flat().forEach((t) => {
        if (t.id) typeMap.set(t.id, t.title);
      });
      setTypes(
        Array.from(typeMap.entries()).map(([id, title]) => ({
          id,
          label: title,
        }))
      );

      // D) enrich rows
      const enriched = mine.map((a) => ({
        ...a,
        clientName: (a.clientIds ?? [])
          .map((id) => clientMap[id] || "Unknown Client")
          .join(", "),
        serviceProviderName: providerName,
        appointmentTypeName: typeMap.get(a.appointmentTypeId) || "",
      }));

      setAppointments(enriched);
      setClients(clientOpts);
    } catch (e: any) {
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, providerName]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ───────── 3. save / delete ───────── */
  const handleSave = async (a: Appointment) => {
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    reload();
  };

  const handleDelete = async (a: Appointment) => {
    await deleteDoc(doc(db, "appointments", a.id!));
    setDialogOpen(false);
    setEditing(null);
    reload();
  };

  /* ───────── 4. render ───────── */
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">
          {providerName}’s Appointments
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          New Appointment
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !appointments.length ? (
        <Typography>No appointments found.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={(a) => {
            setEditing(a);
            setDialogOpen(true);
          }}
          onAssess={(a) =>
            navigate(
              `/service-provider/${serviceProviderId}/appointments/${a.id}/assess`
            )
          }
        />
      )}

      <AppointmentFormDialog
        open={dialogOpen}
        serviceLocationId={appointments[0]?.serviceLocationId || ""}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        clients={clients}
        serviceProviders={[{ id: serviceProviderId!, label: providerName }]}
        appointmentTypes={types}
        canEditClient={true}
        canEditProvider={false}
        canCancel={Boolean(editing)}
      />
    </Box>
  );
}
