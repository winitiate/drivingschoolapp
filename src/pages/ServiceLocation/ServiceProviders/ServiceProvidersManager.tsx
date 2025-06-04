// src/pages/ServiceLocation/ServiceProviders/ServiceProvidersManager.tsx

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { FirestoreServiceProviderStore } from "../../../data/FirestoreServiceProviderStore";
import ServiceProvidersTable from "../../../pages/ServiceProvider/ServiceProvidersTable";
import ServiceProviderFormDialog from "../../../pages/ServiceProvider/ServiceProviderFormDialog";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import type { ServiceProvider } from "../../../models/ServiceProvider";

// A singleton store instance; you can also new it if you prefer:
const store = new FirestoreServiceProviderStore();

export default function ServiceProvidersManager() {
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [usersMap, setUsersMap] = useState<
    Record<string, { firstName: string; lastName: string; email: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  // Fetch all providers for this location + build a small “usersMap”
  // (User’s name & email) so we can render the table.
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1) Get all providers whose providerLocationIds array contains this location
        const all = await store.listByServiceLocation(serviceLocationId);
        setProviders(all);

        // 2) For each provider, fetch that user’s basic info
        const db = getFirestore();
        const map: Record<
          string,
          { firstName: string; lastName: string; email: string }
        > = {};

        await Promise.all(
          all.map(async (p) => {
            if (!map[p.userId]) {
              const snap = await getDoc(doc(db, "users", p.userId));
              if (snap.exists()) {
                const d = snap.data() as any;
                map[p.userId] = {
                  firstName: d.firstName || "",
                  lastName: d.lastName || "",
                  email: d.email || "",
                };
              } else {
                map[p.userId] = { firstName: "", lastName: "", email: "" };
              }
            }
          })
        );
        setUsersMap(map);
      } catch (e: any) {
        setError(e.message || "Failed to load providers");
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId]);

  // ─────────────────────────────────────────────────────────────────────
  // Called when <ServiceProviderFormDialog> invokes onSave(...)
  // We do exactly one .save(...) here, then we update local state.
  // ─────────────────────────────────────────────────────────────────────
  const handleSave = async (provider: ServiceProvider) => {
    setLoading(true);
    setError(null);

    try {
      // Persist to Firestore (either create or update)
      await store.save(provider);

      // Update our local `providers[]`
      setProviders((prev) => {
        const idx = prev.findIndex((p) => p.id === provider.id);
        if (idx >= 0) {
          // overwrite the existing one
          const next = [...prev];
          next[idx] = provider;
          return next;
        }
        // Otherwise append the brand‐new one
        return [...prev, provider];
      });

      // Refresh just that user’s info in usersMap
      // (in case firstName / lastName / email just changed)
      const db = getFirestore();
      const snap = await getDoc(doc(db, "users", provider.userId));
      if (snap.exists()) {
        const d = snap.data() as any;
        setUsersMap((m) => ({
          ...m,
          [provider.userId]: {
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            email: d.email || "",
          },
        }));
      }
    } catch (e: any) {
      console.error("🔴 FirestoreServiceProviderStore.save failed:", e);
      setError(e.message || "Failed to save provider");
    } finally {
      setLoading(false);
      setEditing(null);
      setDialogOpen(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Service Providers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add Provider
        </Button>
      </Box>

      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <ServiceProvidersTable
          serviceProviders={providers}
          usersMap={usersMap}
          loading={false}
          error={null}
          onEdit={(p) => {
            setEditing(p);
            setDialogOpen(true);
          }}
        />
      )}

      <ServiceProviderFormDialog
        open={dialogOpen}
        serviceLocationId={serviceLocationId!}
        initialData={editing || undefined}
        onClose={() => {
          setEditing(null);
          setDialogOpen(false);
        }}
        onSave={handleSave}
      />
    </Box>
  );
}
