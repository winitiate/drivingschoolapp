/* eslint-disable react-hooks/exhaustive-deps */
/*  ────────────────────────────────────────────────────────────────
    Service-location-wide appointment manager (admin view)

    • Lists every appointment whose `serviceLocationId`
      equals the current :id param
    • Resolves client/provider names (with graceful fallback)
    • CRUD with <AdminAppointmentDialog>
    • Refunds payments via the `cancelAppointment` Cloud Function
    ──────────────────────────────────────────────────────────────── */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

import AdminAppointmentDialog
  from "../../../components/Appointments/Admin/AdminAppointmentDialog";
import AppointmentsTable
  from "../../../components/Appointments/AppointmentsTable";

import { FirestoreAppointmentStore } from "../../../data/FirestoreAppointmentStore";
import { FirestoreClientStore }       from "../../../data/FirestoreClientStore";
import { FirestoreServiceProviderStore }
  from "../../../data/FirestoreServiceProviderStore";
import { FirestoreAppointmentTypeStore }
  from "../../../data/FirestoreAppointmentTypeStore";

import type { Appointment } from "../../../models/Appointment";

export default function AppointmentsManager() {
  const { serviceLocationId } =
    useParams<{ serviceLocationId: string }>();

  /* ───────── data stores ───────── */
  const db             = useMemo(() => getFirestore(), []);
  const functions      = useMemo(() => getFunctions(), []);
  const apptStore      = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore    = useMemo(() => new FirestoreClientStore(), []);
  const providerStore  = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore      = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  /* ───────── state ───────── */
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [clientsRaw,    setClientsRaw]    = useState<{ id: string; label: string }[]>([]);
  const [providersRaw,  setProvidersRaw]  = useState<{ id: string; label: string }[]>([]);
  const [typesRaw,      setTypesRaw]      = useState<{ id: string; label: string }[]>([]);
  const [clientMap,     setClientMap]     = useState<Record<string, string>>({});
  const [providerMap,   setProviderMap]   = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editing,       setEditing]       = useState<Appointment | null>(null);

  /* ───────── load / enrich ───────── */
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      /* A) pull every appointment for this service-location */
      const all  = await apptStore.listAll();
      const mine = all.filter(
        (a) => a.serviceLocationId === serviceLocationId
      );

      /* B) resolve CLIENT names (UID fallback logic) */
      const uniqClientIds = Array.from(
        new Set(mine.flatMap((a) => a.clientIds ?? []))
      );
      const clientPairs: { id: string; label: string }[] = await Promise.all(
        uniqClientIds.map(async (cid) => {
          // 1️⃣ try a clients/{cid} doc
          const cDoc = await clientStore.getById(cid).catch(() => null);
          if (cDoc) {
            const snap = await getDoc(doc(db, "users", cDoc.userId));
            if (snap.exists()) {
              const u = snap.data() as any;
              return {
                id: cid,
                label:
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  "Unnamed Client",
              };
            }
          }
          // 2️⃣ fall back to users/{uid}
          const snap = await getDoc(doc(db, "users", cid));
          if (snap.exists()) {
            const u = snap.data() as any;
            return {
              id: cid,
              label:
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                "Unnamed Client",
            };
          }
          return { id: cid, label: "Unknown Client" };
        })
      );
      const cMap = Object.fromEntries(
        clientPairs.map((c) => [c.id, c.label])
      );

      /* C) provider names for this location */
      const provEntities = await providerStore.listByServiceLocation(
        serviceLocationId
      );
      const provPairs: { id: string; label: string }[] = await Promise.all(
        provEntities.map(async (p) => {
          const snap = await getDoc(doc(db, "users", p.userId));
          const u    = snap.exists() ? (snap.data() as any) : {};
          return {
            id: p.id!,
            label:
              [u.firstName, u.lastName].filter(Boolean).join(" ") ||
              "Unknown Provider",
          };
        })
      );
      const pMap = Object.fromEntries(
        provPairs.map((p) => [p.id, p.label])
      );

      /* D) appointment-type titles */
      const types = await typeStore.listByServiceLocation(serviceLocationId);
      const tPairs = types.map((t) => ({
        id: t.id!,
        label: t.title,
      }));

      /* E) final enriched rows */
      const enriched = mine.map((a) => ({
        ...a,
        clientName:          (a.clientIds ?? []).map((id) => cMap[id] || "Unknown Client").join(", "),
        serviceProviderName: (a.serviceProviderIds ?? []).map((id) => pMap[id] || "Unknown Provider").join(", "),
        appointmentTypeName: tPairs.find((t) => t.id === a.appointmentTypeId)?.label || "",
      }));

      /* F) commit state */
      setAppointments(enriched);
      setClientsRaw(clientPairs);
      setProvidersRaw(provPairs);
      setTypesRaw(tPairs);
      setClientMap(cMap);
      setProviderMap(pMap);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [serviceLocationId]);

  useEffect(() => { reload(); }, [reload]);

  /* ───────── option lists for Admin dialog ───────── */
  const clientOpts   = clientsRaw;
  const providerOpts = providersRaw;
  const typeOpts     = typesRaw;

  /* ───────── save / delete / refund ───────── */
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

  const handleRefund = async (a: Appointment) => {
    if (!a.paymentId) return;

    try {
      setLoading(true);
      // Cloud Function: functions/src/payments/cancelAppointment.ts
      const cancelAppt = httpsCallable<
        { appointmentId: string; paymentId: string },
        { success: boolean }
      >(functions, "cancelAppointment");

      await cancelAppt({ appointmentId: a.id!, paymentId: a.paymentId });

      // Mark appointment as refunded/cancelled in Firestore
      await apptStore.save({
        ...a,
        status: "refunded",
      });
    } catch (e: any) {
      setError(e.message || "Refund failed");
    } finally {
      setLoading(false);
      setDialogOpen(false);
      setEditing(null);
      reload();
    }
  };

  /* ───────── render ───────── */
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Appointments</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Appointment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Typography>No appointments for this location.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={(a) => {
            setEditing(a);
            setDialogOpen(true);
          }}
        />
      )}

      <AdminAppointmentDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        onRefund={handleRefund}
        clients={clientOpts}
        providers={providerOpts}
        types={typeOpts}
      />
    </Box>
  );
}
