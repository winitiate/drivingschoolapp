import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, CircularProgress } from '@mui/material';
import TabPanel from '../../components/AdminDashboard/TabPanel';
import AppointmentsTab from './AppointmentsTab';
import StudentsTab from './StudentsTab';
import InstructorsTab from './InstructorsTab';
import Settings from './Settings';
import { useAuth } from '../../auth/useAuth';
import { FirestoreSchoolStore } from '../../data/FirestoreSchoolStore';
import { School } from '../../models/School';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [tab, setTab] = useState(0);

  const [schoolName, setSchoolName] = useState<string>('');
  const [loadingSchool, setLoadingSchool] = useState<boolean>(true);

  useEffect(() => {
    if (!schoolId) return;
    const store = new FirestoreSchoolStore();
    store
      .getById(schoolId)
      .then((s: School | null) => {
        if (s) setSchoolName(s.name);
      })
      .catch(console.error)
      .finally(() => setLoadingSchool(false));
  }, [schoolId]);

  if (!user) return null;
  if (loadingSchool) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box my={2} textAlign="center">
        <Typography variant="h5">
          Welcome, {user.firstName} to {schoolName} Dashboard
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        aria-label="School Admin Dashboard Tabs"
        centered
      >
        <Tab label="Appointments" />
        <Tab label="Students" />
        <Tab label="Instructors" />
        <Tab label="Settings" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <AppointmentsTab />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <StudentsTab />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <InstructorsTab />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <Settings />
      </TabPanel>
    </Box>
  );
}
