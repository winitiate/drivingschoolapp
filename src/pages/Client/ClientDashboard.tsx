/**
 * ClientDashboard.tsx
 *
 * Lists this client’s appointments at one service-location and provides:
 *   • Edit          → AppointmentFormDialog
 *   • Reschedule    → RescheduleAppointmentDialog
 *   • Cancel        → CancelAppointmentDialog
 *   • ViewAssessment
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
import AppointmentsTable           from "../../components/Appointments/AppointmentsTable";
import AppointmentFormDialog       from "../../components/Appointments/AppointmentFormDialog";
import CancelAppointmentDialog     from "../../components/Appointments/CancelAppointmentDialog";
import RescheduleAppointmentDialog from "../../components/Appointments/RescheduleAppointmentDialog";

import { FirestoreAppointmentStore }     from "../../data/FirestoreAppointmentStore";
import { FirestoreServiceProviderStore } from "../../data/FirestoreServiceProviderStore";
import { FirestoreAppointmentTypeStore } from "../../data/FirestoreAppointmentTypeStore";
import { appointmentStore }              from "../../data";

import { getFirestore, doc, getDoc } from "firebase/firestore";
import type { Appointment } from "../../models/Appointment";

export default function ClientDashboard() {
  const { id: locId } = useParams<{ id: string }>();
  const navigate       = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const db = useMemo(() => getFirestore(), []);

  /* Firestore stores ------------------------------------------------------ */
  const apptStore     = useMemo(() => new FirestoreAppointmentStore(), []);
  const providerStore = useMemo(() => new FirestoreServiceProviderStore(), []);
  const typeStore     = useMemo(() => new FirestoreAppointmentTypeStore(), []);

  /* Data state ------------------------------------------------------------ */
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rows,  setRows]  = useState<any[]>([]);
  const [provList, setProvList] = useState<any[]>([]);
  const [provMap,  setProvMap]  = useState<Record<string,string>>({});
  const [typeList, setTypeList] = useState<any[]>([]);

  /* Dialog state ---------------------------------------------------------- */
  const [editOpen,    setEditOpen]    = useState(false);
  const [editing,     setEditing]     = useState<Appointment|null>(null);

  const [cancelOpen,  setCancelOpen]  = useState(false);
  const [toCancel,    setToCancel]    = useState<Appointment|null>(null);

  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedAppt, setReschedAppt] = useState<Appointment|null>(null);

  /* Load + enrich appointments ------------------------------------------- */
  const loadAppointments = useCallback(async () => {
    if (!user?.uid || !locId) return;
    setLoading(true); setError(null);

    try {
      /* 1) fetch appointments for this client & location */
      const all  = await apptStore.listAll();
      const mine = all.filter(a =>
        a.clientIds?.includes(user.uid) && a.serviceLocationId === locId
      );

      /* 2) provider name map */
      const providers = await providerStore.listByServiceLocation(locId);
      const pMap: Record<string,string> = {};
      await Promise.all(
        providers.map(async p => {
          const snap = await getDoc(doc(db,"users",p.userId));
          const d    = snap.exists() ? (snap.data() as any) : {};
          pMap[p.id!] =
            [d.firstName, d.lastName].filter(Boolean).join(" ") ||
            p.displayName || "Provider";
        })
      );

      /* 3) appointment-type title map */
      const types = await typeStore.listByServiceLocation(locId);
      const tMap: Record<string,string> = {};
      types.forEach(t => { if (t.id) tMap[t.id] = t.title; });

      /* 4) build table rows */
      const enriched = mine.map(a => ({
        ...a,
        clientName:          `${user.firstName} ${user.lastName}`,
        serviceProviderName: a.serviceProviderIds?.map(id=>pMap[id] || "(Any)").join(", "),
        appointmentTypeName: tMap[a.appointmentTypeId] || "",
      }));

      setAppointments(mine);
      setRows(enriched);
      setProvList(providers);
      setProvMap(pMap);
      setTypeList(types);

    } catch (e:any) {
      setError(e.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [user, locId, db, apptStore, providerStore, typeStore]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  /* Handlers -------------------------------------------------------------- */
  const handleEdit   = (a:Appointment) => { setEditing(a); setEditOpen(true); };
  const handleSave   = async (u:Appointment) => {
    await appointmentStore.save(u);
    setEditOpen(false);
    loadAppointments();
  };

  const handleCancelClick = (a:Appointment) => { setToCancel(a); setCancelOpen(true); };
  const handleCancelled   = () => { setCancelOpen(false); setToCancel(null); loadAppointments(); };

  const handleReschedClick = (a:Appointment) => { setReschedAppt(a); setReschedOpen(true); };
  const handleRescheduled  = () => { setReschedOpen(false); setReschedAppt(null); loadAppointments(); };

  /* Guards ---------------------------------------------------------------- */
  if (authLoading) return <Box textAlign="center" mt={8}><CircularProgress/></Box>;
  if (!user)       return <Navigate to="/sign-in" replace/>;
  if (!locId || !user.clientLocationIds?.includes(locId)) return <Navigate to="/" replace/>;

  /* ----------------------------------------------------------------------- */
  return (
    <Container maxWidth="md" sx={{ py:4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Client Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <Box sx={{ display:"flex", justifyContent:"center" }}>
        <Box sx={{ width:"100%", maxWidth:"100%" }}>
          <AppointmentsTable
            appointments={rows}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleCancelClick}
            onReschedule={handleReschedClick}
            onViewAssessment={a=>navigate(`/client/${locId}/appointments/${a.id}`)}
          />
        </Box>
      </Box>

      <Box sx={{ textAlign:"center", mt:4 }}>
        <Button
          component={RouterLink}
          to={`/client/${locId}/booking`}
          variant="contained"
        >
          Book An Appointment
        </Button>
      </Box>

      {/* --- Edit dialog --- */}
      {editOpen && editing && (
        <AppointmentFormDialog
          open={editOpen}
          serviceLocationId={locId}
          initialData={editing}
          onClose={()=>setEditOpen(false)}
          onSave={handleSave}
          onDelete={()=>{ setEditOpen(false); loadAppointments(); }}
          clients={[{ id:user.uid, label:`${user.firstName} ${user.lastName}` }]}
          serviceProviders={provList.map(p=>({ id:p.id!, label:provMap[p.id!] }))}
          appointmentTypes={typeList.map(t=>({ id:t.id!, label:t.title }))}
          canEditClient={false}
          canEditProvider
          canEditAppointmentType
          canEditDateTime
          canCancel
        />
      )}

      {/* --- Cancel dialog --- */}
      {toCancel && (
        <CancelAppointmentDialog
          open={cancelOpen}
          appointment={toCancel}
          onClose={()=>{ setCancelOpen(false); setToCancel(null); }}
          onCancelled={handleCancelled}
        />
      )}

      {/* --- Reschedule dialog --- */}
      {reschedAppt && (
        <RescheduleAppointmentDialog
          open={reschedOpen}
          oldAppt={reschedAppt}
          onClose={()=>{ setReschedOpen(false); setReschedAppt(null); }}
          onDone={handleRescheduled}
        />
      )}
    </Container>
  );
}
