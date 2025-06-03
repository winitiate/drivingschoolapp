/**
 * src/components/Appointments/Admin/AppointmentsManager.tsx
 *
 * Service-location-wide appointment manager (admin view).
 *
 * • Lists every appointment whose `serviceLocationId` equals the current :id param.
 * • Resolves client/provider names (with graceful fallback).
 * • CRUD using <AdminAppointmentDialog>.
 * • Soft-cancellation (status change + cancellation metadata) instead of deleting.
 * • Issues refunds via the `cancelAppointment` Cloud Function when necessary.
 *
 * In the soft-cancel flow:
 *   - We update the appointment document by setting `status: "cancelled"`.
 *   - We record a `cancellation` object that includes:
 *       • time:       timestamp of cancellation
 *       • reason:     text reason provided by the admin
 *       • feeApplied: boolean (always set to false here; adjust if you have fees)
 *       • whoCancelled: UID of the currently authenticated admin user
 *
 *   After updating Firestore, we refresh the appointments list.
 */

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
} from "firebase/firestore";
import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import { getAuth } from "firebase/auth";

import AppointmentsTable from "../../../components/Appointments/AppointmentsTable";
import AdminAppointmentDialog from "../../../components/Appointments/Admin/AdminAppointmentDialog";

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

  /* ───────── Initialize Firestore, Functions, Auth, and Stores ───────── */
  const db             = useMemo(() => getFirestore(), []);
  const functions      = useMemo(() => getFunctions(), []);
  const auth           = useMemo(() => getAuth(), []);
  const apptStore      = useMemo(() => new FirestoreAppointmentStore(), []);
  const clientStore    = useMemo(() => new FirestoreClientStore(), []);
  const providerStore  = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore      = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  /* ───────── Component State ───────── */
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [clientsRaw,    setClientsRaw]    = useState<{ id: string; label: string }[]>([]);
  const [providersRaw,  setProvidersRaw]  = useState<{ id: string; label: string }[]>([]);
  const [typesRaw,      setTypesRaw]      = useState<{ id: string; label: string }[]>([]);
  const [clientMap,     setClientMap]     = useState<Record<string, string>>({});
  const [providerMap,   setProviderMap]   = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState<boolean>(true);
  const [error,         setError]         = useState<string | null>(null);
  const [dialogOpen,    setDialogOpen]    = useState<boolean>(false);
  const [editing,       setEditing]       = useState<Appointment | null>(null);

  /* ───────── Load & Enrich Data ───────── */
  const reload = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    try {
      // A) Pull every appointment for this serviceLocationId
      const allAppointments = await apptStore.listAll();
      const mine = allAppointments.filter(
        (a) => a.serviceLocationId === serviceLocationId
      );

      // B) Resolve CLIENT names (with a fallback to users/{uid})
      const uniqClientIds = Array.from(
        new Set(mine.flatMap((a) => a.clientIds ?? []))
      );
      const clientPairs: { id: string; label: string }[] = await Promise.all(
        uniqClientIds.map(async (cid) => {
          // 1️⃣ Try the clients collection for this client ID
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
          // 2️⃣ Fallback to users/{uid}
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

      // C) Resolve PROVIDER names for this location
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

      // D) Fetch appointment-type titles
      const types = await typeStore.listByServiceLocation(serviceLocationId);
      const tPairs = types.map((t) => ({
        id: t.id!,
        label: t.title,
      }));

      // E) Build “enriched” appointment objects with names added
      const enriched = mine.map((a) => ({
        ...a,
        clientName:          (a.clientIds ?? []).map((id) => cMap[id] || "Unknown Client").join(", "),
        serviceProviderName: (a.serviceProviderIds ?? []).map((id) => pMap[id] || "Unknown Provider").join(", "),
        appointmentTypeName: tPairs.find((t) => t.id === a.appointmentTypeId)?.label || "",
      }));

      // F) Commit to state
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
  }, [serviceLocationId, apptStore, clientStore, providerStore, typeStore, db]);

  useEffect(() => {
    reload();
  }, [reload]);

  /* ───────── Option Lists for the Admin Dialog ───────── */
  const clientOpts   = clientsRaw;
  const providerOpts = providersRaw;
  const typeOpts     = typesRaw;

  /* ───────── Save / Soft-Cancel / Refund Handler ───────── */

  /**
   * handleSave
   * • Saves a new or edited appointment via FirestoreAppointmentStore.save()
   * • Closes the dialog and reloads the appointments list.
   */
  const handleSave = async (a: Appointment) => {
    try {
      setLoading(true);
      await apptStore.save(a);
      setDialogOpen(false);
      setEditing(null);
      await reload();
    } catch (e: any) {
      setError(e.message || "Failed to save appointment");
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleCancel
   * • Expects updatedAppt.cancellation.reason to be set by AdminAppointmentDialog’s inline field.
   * • If there is no paymentId, performs a “soft cancel”:
   *     - Updates the appointment’s status to "cancelled"
   *     - Populates `cancellation = { time, reason, feeApplied, whoCancelled }`
   *     - Saves via FirestoreAppointmentStore.save()
   * • If there is a paymentId, it:
   *     1) Calls the `cancelAppointment` HTTPS‐callable to issue a refund.
   *     2) On success, does the same “soft cancel” update on Firestore.
   * • Always closes the dialog and reloads after completing.
   */
  const handleCancel = async (updatedAppt: Appointment) => {
    // Ensure a cancellation reason was provided inline
    const reason = updatedAppt.cancellation?.reason;
    if (!reason || !reason.trim()) {
      // Shouldn’t happen, since AdminAppointmentDialog requires a non-empty reason
      console.warn("No cancellation reason provided; skipping cancel");
      return;
    }

    // Determine who is cancelling
    const currentUser = auth.currentUser;
    const whoCancelled = currentUser?.uid || "unknown";

    setLoading(true);
    setError(null);

    try {
      // 1) If there’s a paymentId, issue a refund first
      const pid = updatedAppt.metadata?.paymentId as string | undefined;
      const cents = (updatedAppt.metadata?.amountCents as number) || 0;
      if (pid) {
        const cancelFn = httpsCallable<
          { appointmentId: string; paymentId: string; amountCents: number; reason: string },
          { success: boolean; refund: { refundId: string; status: string } }
        >(functions, "cancelAppointment");

        console.log("handleCancel → calling cancelAppointment callable", {
          appointmentId: updatedAppt.id,
          paymentId: pid,
          amountCents: cents,
          reason: reason.trim(),
        });
        await cancelFn({
          appointmentId: updatedAppt.id!,
          paymentId: pid,
          amountCents: cents,
          reason: reason.trim(),
        });
        console.log("handleCancel → refund succeeded");
      } else {
        console.log("handleCancel → no metadata.paymentId, skipping refund");
      }

      // 2) Soft-cancel in Firestore
      const softCancelled: Appointment = {
        ...updatedAppt,
        status: "cancelled",
        cancellation: {
          time: new Date(),
          reason: reason.trim(),
          feeApplied: pid ? false : false,
          whoCancelled,
        },
      };
      await apptStore.save(softCancelled);
      console.log("handleCancel → appointment marked ‘cancelled’ in Firestore");
    } catch (e: any) {
      console.error("handleCancel → error in refund or soft-cancel:", e);
      setError(e.message || "Cancellation/refund failed");
    } finally {
      setDialogOpen(false);
      setEditing(null);
      await reload();
      setLoading(false);
    }
  };

  /* ───────── Render ───────── */
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
        // onDelete now performs a soft-cancel + refund; it does NOT delete the Firestore document
        onDelete={handleCancel}
        // If AdminAppointmentDialog has a separate “Refund” button, wire it the same way:
        onRefund={async (a) => {
          await handleCancel(a);
        }}
        clients={clientOpts}
        providers={providerOpts}
        types={typeOpts}
      />
    </Box>
  );
}
