// src/pages/Client/ClientAppointments.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

import AppointmentsTable from '../../components/Appointments/AppointmentsTable';
import ClientAppointmentDialog from '../../components/Appointments/ClientAppointmentDialog';

import { FirestoreAppointmentStore }     from '../../data/FirestoreAppointmentStore';
import { FirestoreAppointmentTypeStore } from '../../data/FirestoreAppointmentTypeStore';
import { FirestoreServiceProviderStore } from '../../data/FirestoreServiceProviderStore';

import type { Appointment } from '../../models/Appointment';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function ClientAppointments() {
  const { id: clientId } = useParams<{ id: string }>();
  const db = getFirestore();

  const apptStore  = new FirestoreAppointmentStore();
  const typeStore  = new FirestoreAppointmentTypeStore();
  const provStore  = new FirestoreServiceProviderStore();

  const [appointments,       setAppointments]       = useState<Appointment[]>([]);
  const [appointmentTypes,   setAppointmentTypes]   = useState<{id:string;label:string}[]>([]);
  const [serviceProviders,   setServiceProviders]   = useState<{id:string;label:string}[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string|null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<Appointment|null>(null);

  const reload = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    try {
      // 1) fetch this client’s appointments
      const rawAppts = await apptStore.listByClient(clientId);

      console.log('rawAppts:', rawAppts);

      // 2) collect all service‐location IDs
      const locIds = Array.from(new Set(
        rawAppts.flatMap(a => a.serviceLocationIds || [])
      ));
      console.log('serviceLocationIds:', locIds);

      // 3) load types & providers per location
      const [ typeLists, provLists ] = await Promise.all([
        Promise.all(locIds.map(l => typeStore.listByServiceLocation(l))),
        Promise.all(locIds.map(l => provStore.listByServiceLocation(l))),
      ]);
      console.log('typeLists raw:', typeLists);
      console.log('provLists raw:', provLists);

      // 4) flatten & unique
      const flattenUnique = <T extends {id:string}>(arrs:T[][]):T[]=>{
        const m = new Map<string,T>();
        arrs.flat().forEach(x=>m.set(x.id,x));
        return Array.from(m.values());
      };
      const uniqueTypes = flattenUnique(typeLists);
      const uniqueProvs = flattenUnique(provLists);
      console.log('uniqueTypes:', uniqueTypes);
      console.log('uniqueProvs:', uniqueProvs);

      // 5) build options
      const typeOpts = uniqueTypes.map(t=>({id:t.id,label:t.title}));
      const provOpts = await Promise.all(uniqueProvs.map(async p=>{
        const snap = await getDoc(doc(db,'users',p.userId));
        const d = snap.exists()?snap.data() as any:{};
        const name = [d.firstName,d.lastName].filter(Boolean).join(' ').trim()||'Unknown Provider';
        return { id:p.id, label:name };
      }));
      console.log('typeOpts:', typeOpts);
      console.log('provOpts:', provOpts);

      // 6) enrich appts for table
      const provMap = Object.fromEntries(provOpts.map(o=>[o.id,o.label]));
      const enriched = rawAppts.map(a=>({
        ...a,
        clientName: 'You',
        serviceProviderName: provMap[a.serviceProviderId]||'Unknown'
      }));

      setAppointments(enriched);
      setAppointmentTypes(typeOpts);
      setServiceProviders(provOpts);

    } catch(e:any) {
      console.error(e);
      setError(e.message||'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  },[clientId]);

  useEffect(()=>{ reload() },[reload]);

  const handleSave = async(a:Appointment)=>{
    await apptStore.save(a);
    setDialogOpen(false);
    setEditing(null);
    await reload();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">My Appointments</Typography>
        <Button
          variant="contained"
          onClick={()=>{ setEditing(null); setDialogOpen(true) }}
        >
          Book New
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}><CircularProgress/></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : appointments.length===0 ? (
        <Typography>No appointments found.</Typography>
      ) : (
        <AppointmentsTable
          appointments={appointments}
          loading={false}
          error={null}
          onEdit={a=>{ setEditing(a); setDialogOpen(true) }}
        />
      )}

      <ClientAppointmentDialog
        open={dialogOpen}
        serviceLocationId={appointments[0]?.serviceLocationIds?.[0]||''}
        initialData={editing||undefined}
        onClose={()=>setDialogOpen(false)}
        onSave={handleSave}
        appointmentTypes={appointmentTypes}
        serviceProviders={serviceProviders}
        clientId={clientId!}
      />
    </Box>
  );
}
