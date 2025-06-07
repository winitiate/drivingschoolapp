// src/pages/SuperAdmin/BusinessManagement/ManageBusinesses.tsx

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

import { FirestoreBusinessStore } from '../../../data/FirestoreBusinessStore';
import type { Business } from '../../../models/Business';

export default function ManageBusinesses() {
  const navigate = useNavigate();
  const store = React.useMemo(() => new FirestoreBusinessStore(), []);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Load all businesses on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await store.listAll();
        setBusinesses(list);
      } catch (e: any) {
        console.error('Error loading businesses:', e);
        setError(e.message || 'Failed to fetch businesses');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [store]);

  // 2) Navigate to “New Business” form
  const handleNew = () => {
    navigate('/super-admin/businesses/new');
  };

  // 3) Navigate to “Edit” for a given business ID
  const handleEdit = (id: string) => {
    navigate(`/super-admin/businesses/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header row: Title on the left, New Business button on the right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5">Manage Businesses</Typography>
        <Button variant="contained" color="primary" onClick={handleNew}>
          New Business
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : businesses.length === 0 ? (
        <Typography>No businesses found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="businesses table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {businesses.map((biz) => (
                <TableRow key={biz.id}>
                  <TableCell>{biz.name}</TableCell>
                  <TableCell>{biz.email || '—'}</TableCell>
                  <TableCell>{biz.phone || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="edit"
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(biz.id!)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
