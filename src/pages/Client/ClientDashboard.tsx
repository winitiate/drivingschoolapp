// src/pages/Client/ClientDashboard.tsx

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
  Divider,
} from "@mui/material";

import { useAuth } from "../../auth/useAuth";
import AppointmentsTable from "../../components/Appointments/AppointmentsTable";
import AppointmentFormDialog from "../../components/Appointments/AppointmentFormDialog";

import { FirestoreAppointmentStore } from "../../data/FirestoreAppointmentStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { appointmentStore } from "../../data";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
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

  // Enriched appointments array
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // Maps for provider names and type titles
  const [provMap, setProvMap] = useState<Record<string, string>>({});
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  /**
   * 1) Load & enrich appointments:
   *    • convert Timestamps → Date
   *    • fetch provider names
   *    • fetch appointmentType titles
   */
  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;

    setLoading(true);
    setError(null);

    try {
      // A) Query the raw appointments
      const apptQuery = query(
        collection(db, "appointments"),
        where("serviceLocationId", "==", locId),
        where("clientIds", "array-contains", user.uid)
      );
      const apptSnap = await getDocs(apptQuery);

      // B) Convert each doc, turning Timestamps into JS Dates
      const rawList: Appointment[] = apptSnap.docs.map((snap) => {
        const data = snap.data() as any;
        const maybeTs = (v: any) =>
          v instanceof Timestamp ? v.toDate() : v;
        return {
          id: snap.id,
          ...data,
          startTime: maybeTs(data.startTime),
          endTime: maybeTs(data.endTime),
        } as Appointment;
      });

      // C) Fetch provider names
      const provQuery = query(
        collection(db, "serviceProviders"),
        where("providerLocationIds", "array-contains", locId)
      );
      const provSnap = await getDocs(provQuery);
      const pMap: Record<string, string> = {};
      provSnap.docs.forEach((snap) => {
        const d = snap.data() as any;
        pMap[snap.id] =
          [d.firstName, d.lastName].filter(Boolean).join(" ") ||
          "(Unnamed Provider)";
      });

      // D) Fetch appointment‐type titles (by serviceLocationId)
      const typeQuery = query(
        collection(db, "appointmentTypes"),
        where("serviceLocationId", "==", locId)
      );
      const typeSnap = await getDocs(typeQuery);
      const tMap: Record<string, string> = {};
      typeSnap.docs.forEach((snap) => {
        const d = snap.data() as any;
        tMap[snap.id] = d.title || "(Unnamed Type)";
      });

      // E) Enrich each appointment
      const enriched = rawList.map((a) => ({
        ...a,
        clientName: `${user.firstName} ${user.lastName}`,
        serviceProviderName: a.serviceProviderIds
          ?.map((id) => pMap[id] || "(Any)")
          .join(", "),
        appointmentTypeName:
          tMap[a.appointmentTypeId] || "(Unknown Type)",
      }));

      setAppointments(enriched);
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

  /** 2) Handlers for edit/save/delete */
  const handleEdit = (appt: Appointment) => {
    setEditing(appt);
    setDialogOpen(true);
  };
  const handleSave = async (updated: Appointment) => {
    try {
      await appointmentStore.save(updated);
      setDialogOpen(false);
      await loadAppointments();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.message || "Failed to save appointment");
    }
  };
  const handleDelete = async (toDelete: Appointment) => {
    try {
      await appointmentStore.delete(toDelete.id!);
      setDialogOpen(false);
      await loadAppointments();
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to delete appointment");
    }
  };

  /** 3) Guards & redirects */
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

  /** 4) Partition into upcoming vs past */
  const now = Date.now();
  const upcoming = appointments.filter(
    (a) => a.startTime.getTime() >= now
  );
  const past = appointments.filter(
    (a) => a.startTime.getTime() < now
  );

  /** 5) Render */
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

      {/* Upcoming */}
      <Typography variant="h5" sx={{ mt: 3 }}>
        Upcoming Appointments
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : upcoming.length === 0 ? (
        <Typography sx={{ mb: 2 }}>No upcoming appointments.</Typography>
      ) : (
        <AppointmentsTable
          appointments={upcoming}
          loading={false}
          error={null}
          onEdit={handleEdit}
          onViewAssessment={(a) =>
            navigate(`/client/${locId}/appointments/${a.id}`)
          }
          showStatusColumn={true}
        />
      )}

      {/* Past */}
      <Typography variant="h5" sx={{ mt: 5 }}>
        Past Appointments
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {past.length === 0 ? (
        <Typography>No past appointments.</Typography>
      ) : (
        <AppointmentsTable
          appointments={past}
          loading={false}
          error={null}
          onEdit={handleEdit}
          onViewAssessment={(a) =>
            navigate(`/client/${locId}/appointments/${a.id}`)
          }
          showStatusColumn={true}
        />
      )}

      {/* Book CTA */}
      <Box sx={{ textAlign: "center", mt: 6 }}>
        <Button
          component={RouterLink}
          to={`/client/${locId}/booking`}
          variant="contained"
        >
          Book An Appointment
        </Button>
      </Box>

      {/* Edit Dialog */}
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
