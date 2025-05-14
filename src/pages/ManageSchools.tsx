// src/pages/ManageSchools.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { useAuth } from '../auth/useAuth';
import { School } from '../models/School';
import { SchoolStore } from '../data/SchoolStore';
import { FirestoreSchoolStore } from '../data/FirestoreSchoolStore';

export default function ManageSchools() {
  const { user, loading: authLoading } = useAuth();
  const store: SchoolStore = new FirestoreSchoolStore();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-superAdmins
  if (authLoading) {
    return (
      <Container maxWidth="md">
        <Box mt={8} textAlign="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  if (!user || user.role !== 'superAdmin') {
    return <Navigate to="/super-admin/sign-in" replace />;
  }

  // Load schools via abstraction
  useEffect(() => {
    store
      .listAll()
      .then(list => setSchools(list))
      .catch(err => setError(err.message || 'Failed to load schools'))
      .finally(() => setLoading(false));
  }, [store]);

  // Update a school's status
  const updateStatus = async (id: string, newStatus: School['status']) => {
    try {
      const target = schools.find(s => s.id === id);
      if (!target) throw new Error('School not found');
      const updated: School = {
        ...target,
        status: newStatus,
        // Optionally update timestamp here if your model includes updatedAt
      };
      await store.save(updated);
      setSchools(prev => prev.map(s => (s.id === id ? updated : s)));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} textAlign="center">
        <Typography variant="h4">Manage Schools</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : schools.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography>No schools found.</Typography>
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>School Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Contact Email</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {schools.map(school => {
              // Handle Firestore Timestamp or JS Date
              const createdAtDate =
                'toDate' in school.createdAt
                  ? school.createdAt.toDate()
                  : school.createdAt;
              return (
                <TableRow key={school.id}>
                  <TableCell>{school.name}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {school.status}
                  </TableCell>
                  <TableCell>{school.contactEmail}</TableCell>
                  <TableCell>
                    {createdAtDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    {school.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => updateStatus(school.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => updateStatus(school.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                    {school.status === 'approved' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => updateStatus(school.id, 'rejected')}
                      >
                        Revoke
                      </Button>
                    )}
                    {school.status === 'rejected' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => updateStatus(school.id, 'pending')}
                      >
                        Re-queue
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Container>
  );
}
