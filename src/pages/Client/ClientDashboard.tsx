// src/pages/Client/ClientDashboard.tsx

/**
 * ClientDashboard.tsx
 *
 * Displays all appointments for the current client at a given service location.
 * The client’s UID must appear in each appointment’s `clientIds[]`, and the
 * appointment’s `serviceLocationId` must match `locId`.
 *
 * We require Firestore rules to allow:
 *   • Read appointments when serviceLocationId ∈ me().clientLocationIds.
 *   • Read serviceProviders when any providerLocationIds ∈ me().clientLocationIds.
 *   • Read appointmentTypes when locationId ∈ me().clientLocationIds.
 *
 * Accordingly, we:
 *   - Query appointments with two filters (one on serviceLocationId, one on clientIds),
 *     so we only fetch allowed docs.
 *   - Query serviceProviders via `where("providerLocationIds", "array-contains", locId)`.
 *   - Query appointmentTypes via `where("locationId", "==", locId)`.
 *
 * We then “enrich” each appointment to display:
 *   - clientName  (the current user’s name, from `user`)
 *   - providerName(s) (fetched from serviceProviders’ own `firstName`/`lastName` fields)
 *   - appointmentTypeName (from the appointmentTypes documents)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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

import { appointmentStore } from "../../data"; // for save/delete
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import type { Appointment } from "../../models/Appointment";

export default function ClientDashboard() {
  const { id: locId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const db = useMemo(() => getFirestore(), []);

  const apptStore = useMemo(() => new FirestoreAppointmentStore(), []);
  const providerStore = useMemo(
    () => new FirestoreServiceProviderStore(),
    []
  );
  const typeStore = useMemo(
    () => new FirestoreAppointmentTypeStore(),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [enrichedAppointments, setEnriched] = useState<any[]>([]);

  // We’ll hold two maps:
  //   provMap: providerId → “First Last”
  //   typeMap: typeId → title
  const [provMap, setProvMap] = useState<Record<string, string>>({});
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // 1) Load & Enrich Appointments
  // ──────────────────────────────────────────────────────────────────────────
  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;

    setLoading(true);
    setError(null);

    try {
      // A) Query appointments where:
      //    - serviceLocationId == locId
      //    - clientIds array contains user.uid
      const apptQuery = query(
        collection(db, "appointments"),
        where("serviceLocationId", "==", locId),
        where("clientIds", "array-contains", user.uid)
      );
      const apptSnap = await getDocs(apptQuery);
      const mine: Appointment[] = apptSnap.docs.map((snap) => {
        const data = snap.data() as Appointment;
        return { id: snap.id, ...data };
      });

      // B) Query all providers serving this location
      //    Clients are allowed if serviceProviders.providerLocationIds contains locId
      const provQuery = query(
        collection(db, "serviceProviders"),
        where("providerLocationIds", "array-contains", locId)
      );
      const provSnap = await getDocs(provQuery);
      const providers = provSnap.docs.map((snap) => {
        const data = snap.data() as any;
        return {
          id: snap.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        };
      });

      // Build provMap: { providerId: "First Last" }
      const pMap: Record<string, string> = {};
      providers.forEach((p) => {
        pMap[p.id] = [p.firstName, p.lastName]
          .filter(Boolean)
          .join(" ") || "(Unnamed Provider)";
      });

      // C) Query all appointment types for this location
      //    Clients are allowed if resource.data.locationId == locId
      const typeQuery = query(
        collection(db, "appointmentTypes"),
        where("locationId", "==", locId)
      );
      const typeSnap = await getDocs(typeQuery);
      const types = typeSnap.docs.map((snap) => {
        const data = snap.data() as any;
        return { id: snap.id, title: data.title || "" };
      });

      // Build typeMap: { typeId: "Type Title" }
      const tMap: Record<string, string> = {};
      types.forEach((t) => {
        tMap[t.id] = t.title || "(Unnamed Type)";
      });

      // D) Enrich each appointment for display
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
      setProvMap(pMap);
      setTypeMap(tMap);
    } catch (e: any) {
      console.error("Failed to load appointments:", e);
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [user, locId, db]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2) Handlers for Edit, Save, Delete
  // ──────────────────────────────────────────────────────────────────────────
  const handleEdit = useCallback((appt: Appointment) => {
    setEditing(appt);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (updated: Appointment) => {
      try {
        await appointmentStore.save(updated);
        setDialogOpen(false);
        loadAppointments();
      } catch (saveErr: any) {
        console.error("Failed to save appointment:", saveErr);
        setError(saveErr.message || "Failed to save appointment");
      }
    },
    [loadAppointments]
  );

  const handleDelete = useCallback(
    async (toDelete: Appointment) => {
      try {
        await appointmentStore.delete(toDelete.id!);
        setDialogOpen(false);
        loadAppointments();
      } catch (delErr: any) {
        console.error("Failed to delete appointment:", delErr);
        setError(delErr.message || "Failed to delete appointment");
      }
    },
    [loadAppointments]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 3) Redirects / Guards
  // ──────────────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  // If no locId or client isn’t actually a client of that loc, redirect
  if (!locId || !user.clientLocationIds?.includes(locId)) {
    return <Navigate to="/" replace />;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4) Render
  // ──────────────────────────────────────────────────────────────────────────
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
            {
              id: user.uid,
              label: `${user.firstName} ${user.lastName}`,
            },
          ]}
          serviceProviders={Object.entries(provMap).map(
            ([id, label]) => ({ id, label })
          )}
          appointmentTypes={Object.entries(typeMap).map(
            ([id, title]) => ({ id, label: title })
          )}
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
