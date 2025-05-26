// src/pages/Business/BusinessDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, CircularProgress } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function BusinessDashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setError('Invalid business ID');
      setLoading(false);
      return;
    }

    const fetchName = async () => {
      try {
        const snap = await getDoc(doc(db, 'businesses', businessId));
        if (snap.exists()) {
          const data = snap.data() as { name?: string };
          setBusinessName(data.name ?? 'Business');
        } else {
          setError('Business not found');
        }
      } catch {
        setError('Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    fetchName();
  }, [businessId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h5" mb={3}>
        {businessName} Business Owner Dashboard
      </Typography>

      <Grid container spacing={2}>
        <Grid item>
          <Button
            component={RouterLink}
            to={`/business/${businessId}/service-locations`}
            variant="contained"
          >
            Manage Locations
          </Button>
        </Grid>
        <Grid item>
          <Button
            component={RouterLink}
            to={`/business/${businessId}/form-templates`}
            variant="contained"
          >
            Form Templates
          </Button>
        </Grid>
        <Grid item>
          <Button
            component={RouterLink}
            to={`/business/${businessId}/settings`}
            variant="contained"
          >
            Business Settings
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
