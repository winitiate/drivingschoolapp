import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
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
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import { FirestoreSubscriptionPackageStore } from "../../../data/FirestoreSubscriptionPackageStore";
import type { SubscriptionPackage } from "../../../models/SubscriptionPackage";

export default function SubscriptionPackagesPage() {
  const navigate = useNavigate();
  // ← use the subscription store!
  const store = useMemo(() => new FirestoreSubscriptionPackageStore(), []);

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SubscriptionPackage | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 1) load all subscriptionPackages on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // now queries subscriptionPackages collection, ordered by `order`
        const list = await store.listAll();
        setPackages(list);
      } catch (e: any) {
        console.error("Failed to load subscription packages", e);
        setError(e.message || "Failed to load subscription packages");
      } finally {
        setLoading(false);
      }
    })();
  }, [store]);

  // 2) navigate handlers
  const handleNew = () => navigate("/super-admin/subscription-packages/new");
  const handleEdit = (p: SubscriptionPackage) =>
    navigate(`/super-admin/subscription-packages/${p.id}`);
  const confirmDelete = (p: SubscriptionPackage) => setDeleteCandidate(p);

  // 3) delete
  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await store.delete(deleteCandidate.id!);
      setPackages(await store.listAll());
      setDeleteCandidate(null);
    } catch (e: any) {
      console.error("Delete failed", e);
      setError(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };
  const cancelDelete = () => setDeleteCandidate(null);

  // 4) reorder
  const handleReorder = async (from: number, to: number) => {
    const updated = [...packages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    const reindexed = updated.map((p, i) => ({ ...p, order: i + 1 }));
    setPackages(reindexed);
    try {
      await Promise.all(reindexed.map((p) => store.save(p)));
    } catch (e) {
      console.error("Reorder save failed", e);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Subscription Packages
      </Typography>
      <Button variant="contained" onClick={handleNew} sx={{ mb: 2 }}>
        + New Package
      </Button>
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : packages.length === 0 ? (
        <Typography>No subscription packages found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Price&nbsp;($)</TableCell>
                <TableCell align="right">Max&nbsp;Locations</TableCell>
                <TableCell align="right">Max&nbsp;Providers</TableCell>
                <TableCell align="right">Max&nbsp;Clients</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((pkg, idx) => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.order ?? idx + 1}</TableCell>
                  <TableCell>{pkg.title}</TableCell>
                  <TableCell>{pkg.description || "—"}</TableCell>
                  <TableCell align="right">
                    {(pkg.priceCents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    {pkg.maxLocations ?? "∞"}
                  </TableCell>
                  <TableCell align="right">
                    {pkg.maxProviders ?? "∞"}
                  </TableCell>
                  <TableCell align="right">
                    {pkg.maxClients ?? "∞"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(pkg)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => confirmDelete(pkg)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    {idx > 0 && (
                      <IconButton size="small" onClick={() => handleReorder(idx, idx - 1)}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    )}
                    {idx < packages.length - 1 && (
                      <IconButton size="small" onClick={() => handleReorder(idx, idx + 1)}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!deleteCandidate} onClose={cancelDelete}>
        <DialogTitle>
          {deleting ? "Deleting…" : `Delete "${deleteCandidate?.title}"?`}
        </DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
