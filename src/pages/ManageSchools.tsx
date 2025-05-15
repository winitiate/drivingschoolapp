// src/pages/ManageSchools.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import SchoolFormDialog from '../components/Schools/SchoolFormDialog';
import SchoolsTable from '../components/Schools/SchoolsTable';
import { useAuth } from '../auth/useAuth';
import { FirestoreSchoolStore } from '../data/FirestoreSchoolStore';
import { School } from '../models/School';

export default function ManageSchools() {
  const { user, loading: authLoading } = useAuth();

  // Memoize the store so it doesn't recreate each render
  const store = useMemo(() => new FirestoreSchoolStore(), []);

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);

  // reloadSchools no longer changes unless store changes (which it won't)
  const reloadSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await store.listAll();
      setSchools(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  }, [store]);

  // Initial load (and only once) once auth resolves and we have a superAdmin
  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.roles.includes('superAdmin')) return;
    reloadSchools();
  }, [authLoading, user, reloadSchools]);

  const handleAdd = async (data: Partial<School>) => {
    try {
      await store.save(data as School);
      await reloadSchools();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleEdit = async (data: Partial<School>) => {
    try {
      await store.save(data as School);
      await reloadSchools();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateStatus = (id: string, status: School['status']) =>
    handleEdit({ id, status });

  if (authLoading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user || !user.roles.includes('superAdmin')) {
    return <Navigate to="/super-admin/sign-in" replace />;
  }

  return (
    <Container maxWidth="md">
      <Box
        mt={4}
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4">Manage Schools</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add a School
        </Button>
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
      ) : (
        <SchoolsTable
          schools={schools}
          loading={false}
          error={null}
          onUpdateStatus={handleUpdateStatus}
          onEdit={school => {
            setEditing(school);
            setDialogOpen(true);
          }}
        />
      )}

      <SchoolFormDialog
        open={dialogOpen}
        initialData={editing || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={data => {
          editing ? handleEdit(data) : handleAdd(data);
          setDialogOpen(false);
        }}
      />
    </Container>
  );
}
