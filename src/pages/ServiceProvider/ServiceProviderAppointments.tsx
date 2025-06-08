/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/ServiceProvider/ServiceProviderAppointments.tsx

/**
 * ServiceProviderAppointments.tsx
 *
 * This component displays a list of appointments for the currently
 * authenticated service provider. It fetches only the appointments
 * that the provider is authorized to read (i.e., appointment.serviceLocationId
 * is in the provider’s providerLocationIds, and appointment.serviceProviderIds
 * array contains the provider’s ID). Similarly, attempts to load client names
 * or other user profiles are wrapped in try/catch to avoid “permission denied.”
 *
 * Firestore security rules must allow:
 *  • Reading /serviceProviders/{providerId} if userId == request.auth.uid
 *  • Reading /appointments/{apptId} if resource.data.serviceLocationId is in the provider’s providerLocationIds
 *    and resource.data.serviceProviderIds contains the provider’s ID
 *  • Reading /users/{uid} only if uid == request.auth.uid
 *  • (We wrap all other user‐doc reads in try/catch so failures do not break the UI.)
 *
 * Appointment creation, editing, and deletion are performed via apptStore.save(...) and deleteDoc(...),
 * which require corresponding “allow write” rules on /appointments.
 */

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
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import AppointmentsTable from "../../components/Appointments/AppointmentsTable";
import AppointmentFormDialog, { Option } from "../../components/Appointments/AppointmentFormDialog";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";
import { FirestoreClientStore } from "../../data/FirestoreClientStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";

import type { Appointment } from "../../models/Appointment";

export default function ServiceProviderAppointments() {
  const { serviceProviderId } = useParams<{ serviceProviderId: string }>();
  const navigate = useNavigate();

  const db = useMemo(() => getFirestore(), []);
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore = useMemo(() => new FirestoreClientStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);

  /* ───────── state ───────── */
  const [providerName, setProviderName] = useState("Service Provider");
  const [providerLocationIds, setProviderLocationIds] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  /* 1. Load provider’s profile (to get their name and providerLocationIds) */
  useEffect(() => {
    if (!serviceProviderId) return;
    (async () => {
      setLoading(true);
      try {
        const prov = await providerStore.getById(serviceProviderId);
        if (prov) {
          setProviderLocationIds(prov.providerLocationIds || []);
          try {
            const userSnap = await getDoc(doc(db, "users", prov.userId));
            if (userSnap.exists()) {
              const u = userSnap.data() as any;
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
              setProviderName(fullName || "Service Provider");
            }
          } catch {
            /* ignore permission errors */
          }
        }
      } catch (e: any) {
        console.error("Error loading serviceProvider profile:", e);
        setError("Failed to load service provider profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceProviderId, db]);

  /* 2. Load / enrich appointments */
  const reload = useCallback(async () => {
    if (!serviceProviderId || !providerLocationIds.length) return;
    setLoading(true);
    setError(null);
    try {
      // ── A) Query appointments for your locations *and* your provider‐ID
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("serviceLocationId", "in", providerLocationIds.slice(0, 10)),
        // ← **ARRAY-CONTAINS** on the *array* field:
        where("serviceProviderIds", "array-contains", serviceProviderId)
      );
      const apptSnap = await getDocs(appointmentsQuery);
      const raw: Appointment[] = apptSnap.docs.map((snap) => {
        const data = snap.data() as Appointment;
        return { id: snap.id, ...data };
      });

      // ── B) Gather unique client IDs
      const uniqClientIds = Array.from(
        new Set(raw.flatMap((a) => a.clientIds ?? []))
      );

      // ── C) Load client display names
      const clientOpts: Option[] = [];
      await Promise.all(
        uniqClientIds.map(async (cid) => {
          let label = "Unknown Client";
          try {
            const cEnt = await clientStore.getById(cid);
            if (cEnt) {
              try {
                const userSnap = await getDoc(doc(db, "users", cEnt.userId));
                if (userSnap.exists()) {
                  const d = userSnap.data() as any;
                  label = [d.firstName, d.lastName]
                    .filter(Boolean)
                    .join(" ") || "Unnamed Client";
                }
              } catch {}
            }
          } catch {}
          if (label === "Unknown Client") {
            try {
              const userSnap2 = await getDoc(doc(db, "users", cid));
              if (userSnap2.exists()) {
                const d2 = userSnap2.data() as any;
                label = [d2.firstName, d2.lastName]
                  .filter(Boolean)
                  .join(" ") || "Unnamed Client";
              }
            } catch {}
          }
          clientOpts.push({ id: cid, label });
        })
      );
      const clientMap = Object.fromEntries(clientOpts.map((c) => [c.id, c.label]));
      setClients(clientOpts);

      // ── D) Load appointment‐types *for each* location
      const locIds = Array.from(new Set(raw.map((a) => a.serviceLocationId)));
      const typeLists = await Promise.all(
        locIds.map((loc) =>
          typeStore
            .listByServiceLocation(loc)
            .catch(() => [])
        )
      );
      const typeMap = new Map<string, string>();
      typeLists.flat().forEach((t) => {
        if (t.id && t.title) {
          typeMap.set(t.id, t.title);
        }
      });
      // Keep a list for any FormDialogs, but we’ll pull the name from the map below
      setTypes(
        Array.from(typeMap.entries()).map(([id, title]) => ({
          id,
          label: title,
        }))
      );

      // ── E) Enrich and set
      const enriched = raw.map((a) => ({
        ...a,
        clientName: (a.clientIds ?? [])
          .map((cid) => clientMap[cid] || "Unknown Client")
          .join(", "),
        serviceProviderName: providerName,
        // ← **FALL BACK** to a visible dash if no type found
        appointmentTypeName: typeMap.get(a.appointmentTypeId) ?? "—",
      }));

      setAppointments(enriched);
    } catch (e: any) {
      console.error("Failed to load appointments:", e);
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [serviceProviderId, providerLocationIds, providerName, db]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* 3. Handlers for save / delete */
  const handleSave = async (a: Appointment) => {
    try {
      await apptStore.save(a);
      setDialogOpen(false);
      setEditing(null);
      reload();
    } catch (saveErr: any) {
      console.error("Failed to save appointment:", saveErr);
      setError(saveErr.message || "Failed to save appointment");
    }
  };
  const handleDelete = async (a: Appointment) => {
    try {
      await deleteDoc(doc(db, "appointments", a.id!));
      setDialogOpen(false);
      setEditing(null);
      reload();
    } catch (delErr: any) {
      console.error("Failed to delete appointment:", delErr);
      setError(delErr.message || "Failed to delete appointment");
    }
  };

  /* 4. Render */
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">{providerName}’s Appointments</Typography>
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
        serviceProviders={[
          { id: serviceProviderId!, label: providerName },
        ]}
        appointmentTypes={types}
        canEditClient={true}
        canEditProvider={false}
        canCancel={Boolean(editing)}
      />
    </Box>
  );
}
