// src/pages/Client/ClientDashboard.tsx

/**
 * ClientDashboard.tsx
 *
 * Displays the client’s dashboard for a given service location:
 *  • Loads & filters appointments for the current user & location
 *  • Enriches each appointment with client name, provider names, and type title
 *  • Renders a table with actions: Edit, View Assessment, Cancel
 *  • Supports editing via AppointmentFormDialog
 *  • Supports cancellation via CancelAppointmentDialog (fee confirmation + refund)
 *
 * All cancellation logic lives in CancelAppointmentDialog; this page only
 * wires the dialog into the UI and refreshes the list on completion.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useParams,
  useNavigate,
  Navigate,
  Link as RouterLink,
} from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";

import { useAuth } from "../../auth/useAuth";
import AppointmentsTable from "../../components/Appointments/AppointmentsTable";
import AppointmentFormDialog from "../../components/Appointments/AppointmentFormDialog";
import CancelAppointmentDialog from "../../components/Appointments/CancelAppointmentDialog";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { appointmentStore } from "../../data";

import { getFirestore, doc, getDoc } from "firebase/firestore";
import type { Appointment } from "../../models/Appointment";

export default function ClientDashboard() {
  const { id: locId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const db = useMemo(() => getFirestore(), []);

  // Firestore-backed stores for appointments, providers, and types
  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  // Local state for data loading & enrichment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [enrichedAppointments, setEnriched] = useState<any[]>([]);
  const [provList, setProvList] = useState<any[]>([]);
  const [provMap, setProvMap] = useState<Record<string, string>>({});
  const [typeList, setTypeList] = useState<any[]>([]);

  // State for the “Edit appointment” dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  // State for the “Cancel appointment” dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  /**
   * loadAppointments
   *
   * Fetches all appointments, filters to those for the current user & location,
   * builds provider & type name maps, and enriches each appointment record
   * with display-friendly fields.
   */
  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;
    setLoading(true);
    setError(null);

    try {
      // 1) Fetch & filter
      const all = await apptStore.listAll();
      const mine = all.filter(
        (a) =>
          a.clientIds?.includes(user.uid) &&
          a.serviceLocationId === locId
      );

      // 2) Build provider name map
      const providers = await providerStore.listByServiceLocation(locId);
      const pMap: Record<string, string> = {};
      await Promise.all(
        providers.map(async (p) => {
          const snap = await getDoc(doc(db, "users", p.userId));
          const d = snap.exists() ? (snap.data() as any) : {};
          pMap[p.id!] =
            [d.firstName, d.lastName].filter(Boolean).join(" ") ||
            "Unknown Provider";
        })
      );

      // 3) Build appointment-type title map
      const types = await typeStore.listByServiceLocation(locId);
      const tMap: Record<string, string> = {};
      types.forEach((t) => {
        if (t.id) tMap[t.id] = t.title;
      });

      // 4) Enrich each appointment record
      const enriched = mine.map((a) => ({
        ...a,
        clientName: `${user.firstName} ${user.lastName}`,
        serviceProviderName: a.serviceProviderIds
          ?.map((id) => pMap[id] || "(Any)")
          .join(", "),
        appointmentTypeName: tMap[a.appointmentTypeId] || "",
      }));

      setAppointments(mine);
      setEnriched(enriched);
      setProvList(providers);
      setProvMap(pMap);
      setTypeList(types);
    } catch (e: any) {
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [user, locId, db, apptStore, providerStore, typeStore]);

  // Load once, and whenever dependencies change
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // ——— Edit appointment handlers ————————————————————————————

  const handleEdit = useCallback((appt: Appointment) => {
    setEditing(appt);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (updated: Appointment) => {
      await appointmentStore.save(updated);
      setDialogOpen(false);
      loadAppointments();
    },
    [loadAppointments]
  );

  // ——— Cancel appointment handlers —————————————————————————

  /**
   * handleCancelClick
   *
   * Opens the CancelAppointmentDialog for the selected appointment.
   */
  const handleCancelClick = useCallback((appt: Appointment) => {
    setToCancel(appt);
    setCancelDialogOpen(true);
  }, []);

  /**
   * handleCancelled
   *
   * Callback after a successful cancellation (and refund, if any).
   * Closes the dialog and reloads the appointments list.
   */
  const handleCancelled = useCallback(
    (result: any) => {
      setCancelDialogOpen(false);
      setToCancel(null);
      loadAppointments();
    },
    [loadAppointments]
  );

  // ——— Access control & loading states ————————————————————————

  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!locId || !user.clientLocationIds?.includes(locId)) {
    return <Navigate to="/" replace />;
  }

  // ——— Main render ——————————————————————————————————————————

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Client Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: "100%" }}>
          <AppointmentsTable
            appointments={enrichedAppointments}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleCancelClick}
            onViewAssessment={(appt) =>
              navigate(`/client/${locId}/appointments/${appt.id}`)
            }
          />
        </Box>
      </Box>

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          component={RouterLink}
          to={`/client/${locId}/booking`}
          variant="contained"
        >
          Book An Appointment
        </Button>
      </Box>

      {/* Edit Appointment Dialog */}
      {dialogOpen && editing && (
        <AppointmentFormDialog
          open={dialogOpen}
          serviceLocationId={locId}
          initialData={editing}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          onDelete={() => {
            setDialogOpen(false);
            loadAppointments();
          }}
          clients={[
            { id: user.uid, label: `${user.firstName} ${user.lastName}` },
          ]}
          serviceProviders={provList.map((p) => ({
            id: p.id!,
            label: provMap[p.id!] || "(Any)",
          }))}
          appointmentTypes={typeList.map((t) => ({
            id: t.id!,
            label: t.title,
          }))}
          canEditClient={false}
          canEditProvider={true}
          canEditAppointmentType={true}
          canEditDateTime={true}
          canCancel={true}
        />
      )}

      {/* Cancel Appointment Dialog */}
      {toCancel && (
        <CancelAppointmentDialog
          open={cancelDialogOpen}
          appointment={toCancel}
          onClose={() => {
            setCancelDialogOpen(false);
            setToCancel(null);
          }}
          onCancelled={handleCancelled}
        />
      )}
    </Container>
  );
}
