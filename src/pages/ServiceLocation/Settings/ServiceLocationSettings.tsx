// src/pages/ServiceLocation/Settings/ServiceLocationSettings.tsx

import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import TabPanel from '../../../components/ServiceLocationDashboard/TabPanel';

import AppointmentTypesManager     from './AppointmentTypes/AppointmentTypesManager';
import AssessmentTypesManager      from './AssessmentTypes/AssessmentTypesManager';
import GradingScalesManager        from './GradingScales/GradingScalesManager';
import PackageSettings             from './PackageSettings/PackageSettings';
import BusinessHoursSettings       from './BusinessHours/BusinessHoursSettings';
import FAQSettings                 from './FAQSettings/FaqSettings';
import SquareUpSettings            from './SquareUpSettings/SquareUpSettings';
import AdminSettings               from './ServiceLocationAdminSettings/ServiceLocationAdminSettings';

export default function ServiceLocationSettings() {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        aria-label="Service Location Settings Tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Appointment Types" />
        <Tab label="Assessment Types" />
        <Tab label="Grading Scales" />
        <Tab label="Packages" />
        <Tab label="Business Hours" />
        <Tab label="FAQs" />
        <Tab label="SquareUp" />
        <Tab label="Admin" />
      </Tabs>

      <TabPanel value={subTab} index={0}><AppointmentTypesManager /></TabPanel>
      <TabPanel value={subTab} index={1}><AssessmentTypesManager /></TabPanel>
      <TabPanel value={subTab} index={2}><GradingScalesManager /></TabPanel>
      <TabPanel value={subTab} index={3}><PackageSettings /></TabPanel>
      <TabPanel value={subTab} index={4}><BusinessHoursSettings /></TabPanel>
      <TabPanel value={subTab} index={5}><FAQSettings /></TabPanel>
      <TabPanel value={subTab} index={6}><SquareUpSettings /></TabPanel>
      <TabPanel value={subTab} index={7}><AdminSettings /></TabPanel>
    </Box>
  );
}
