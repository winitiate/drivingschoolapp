// src/pages/Client/ClientDashboard.tsx
//
// • Uses the new Appointment shape: clientIds[], serviceProviderIds[],
//   startTime / endTime, etc.
// • Filters by the singular `serviceLocationId` field (not the old array).
// • Joins multiple providers’ names for display.
// • Everything else (UI, dialogs, navigation) is left intact.
//

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

  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [enrichedAppointments, setEnriched] = useState<any[]>([]);
  const [provList, setProvList] = useState<any[]>([]);
  const [provMap, setProvMap] = useState<Record<string, string>>({});
  const [typeList, setTypeList] = useState<any[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;
    setLoading(true);
    setError(null);

    try {
      const all = await apptStore.listAll();
      const mine = all.filter(
        (a) =>
          a.clientIds?.includes(user.uid) &&
          a.serviceLocationId === locId
      );

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

      const types = await typeStore.listByServiceLocation(locId);
      const tMap: Record<string, string> = {};
      types.forEach((t) => {
        if (t.id) tMap[t.id] = t.title;
      });

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

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

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

  const handleDelete = useCallback(
    async (toDelete: Appointment) => {
      await appointmentStore.delete(toDelete.id!);
      setDialogOpen(false);
      loadAppointments();
    },
    [loadAppointments]
  );

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

      {dialogOpen && editing && (
        <AppointmentFormDialog
          open={dialogOpen}
          serviceLocationId={locId}
          initialData={editing}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
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
    </Container>
  );
}
