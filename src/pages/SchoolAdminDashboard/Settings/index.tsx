import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import TabPanel from '../../../components/AdminDashboard/TabPanel';

import LessonSettings from './LessonSettings';
import PackageSettings from './PackageSettings';
import BusinessHoursSettings from './BusinessHoursSettings';
import FAQSettings from './FAQSettings';
import SquareUpSettings from './SquareUpSettings';
import AdminSettings from './AdminSettings';

export default function Settings() {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        aria-label="Settings Tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Lesson Settings" />
        <Tab label="Package Settings" />
        <Tab label="Business Hours" />
        <Tab label="FAQ Settings" />
        <Tab label="SquareUp Settings" />
        <Tab label="Admin Settings" />
      </Tabs>

      <TabPanel value={subTab} index={0}><LessonSettings /></TabPanel>
      <TabPanel value={subTab} index={1}><PackageSettings /></TabPanel>
      <TabPanel value={subTab} index={2}><BusinessHoursSettings /></TabPanel>
      <TabPanel value={subTab} index={3}><FAQSettings /></TabPanel>
      <TabPanel value={subTab} index={4}><SquareUpSettings /></TabPanel>
      <TabPanel value={subTab} index={5}><AdminSettings /></TabPanel>
    </Box>
  );
}
