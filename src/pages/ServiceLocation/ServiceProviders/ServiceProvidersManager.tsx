// src/pages/ServiceLocation/ServiceProviders/ServiceProvidersManager.tsx

/**
 * ServiceProvidersManager
 *
 * This component lists all service providers for the given serviceLocationId,
 * and allows the admin to add or edit a provider. In our “pending → onboarded”
 * flow, creating a brand-new provider should write a placeholder to
 * /serviceProvidersPending, not directly to /serviceProviders. The Cloud Function
 * will then create the real /users/{uid} and /serviceProviders/{uid} entries
 * and delete the pending document. Editing an existing provider continues to
 * call the FirestoreServiceProviderStore.save(...) method.
 *
 * The table is refreshed whenever the underlying /serviceProviders collection
 * changes (e.g. because the Cloud Function wrote the new document).
 */

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

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import type { ServiceProvider } from "../../../models/ServiceProvider";

// Instantiate the store for reading/updating existing providers
const store = new FirestoreServiceProviderStore();

export default function ServiceProvidersManager() {
  const { serviceLocationId } =
    useParams<{ serviceLocationId: string }>();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [usersMap, setUsersMap] = useState<
    Record<string, { firstName: string; lastName: string; email: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch all providers for this location + build a small “usersMap”
  // (User’s name & email) so we can render the table.
  // Whenever serviceLocationId changes, re-fetch.
  // ─────────────────────────────────────────────────────────────────────────────
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
                // If the user doc is temporarily missing (shouldn't happen often),
                // put empty placeholders.
                map[p.userId] = {
                  firstName: "",
                  lastName: "",
                  email: "",
                };
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Called when <ServiceProviderFormDialog> invokes onSave(provider)
  // If editing an existing provider (i.e., provider.id exists in /serviceProviders),
  // we simply call store.save(provider). Otherwise, for a new provider (id undefined),
  // we write a placeholder to /serviceProvidersPending. The Cloud Function will then
  // pick up that pending doc, create the real /users/{uid} and /serviceProviders/{uid},
  // and delete the pending doc.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSave = async (provider: ServiceProvider) => {
    setLoading(true);
    setError(null);

    try {
      const db = getFirestore();

      if (provider.id) {
        // ─── EDIT EXISTING ─────────────────────────────────────────────────────
        // If editing an existing provider (id present), just update the real doc
        await store.save(provider);

        // Update local providers array
        setProviders((prev) => {
          const idx = prev.findIndex((p) => p.id === provider.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = provider;
            return next;
          }
          return prev;
        });

        // Refresh just that user's info in usersMap
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
      } else {
        // ─── CREATE NEW (PENDING) ────────────────────────────────────────────
        // For a brand-new provider, we write a placeholder to /serviceProvidersPending.
        // The Cloud Function onNewServiceProviderPending will:
        //   • create a new Auth user for this email,
        //   • write /users/{uid} and /serviceProviders/{uid},
        //   • delete the pending placeholder.

        // Generate a random ID for the pending placeholder
        const pendingId = uuidv4();

        // Build the pending data shape. Note: we store all relevant fields,
        // including email, firstName, lastName, license info, and the single
        // serviceLocationId this admin associated.
        await setDoc(doc(db, "serviceProvidersPending", pendingId), {
          // We intentionally do NOT set 'id' or 'userId' here, because the Cloud Function
          // will generate a brand-new Auth UID and then write the real IDs.
          email: provider.email.trim().toLowerCase(),
          firstName: provider.firstName || "",
          lastName: provider.lastName || "",
          licenseNumber: provider.licenseNumber || "",
          licenseClass: provider.licenseClass || "",
          address: provider.address || { street: "", city: "", postalCode: "" },
          backgroundCheck:
            provider.backgroundCheck || {
              date: new Date(),
              status: "pending",
            },
          // Pass the single serviceLocationId that this manager is editing:
          providerLocationIds: [serviceLocationId!],
          // Timestamps for admin reference (optional, used by CF only for audit)
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // We do NOT immediately append to `providers[]`, because the real
        // /serviceProviders/{uid} does not exist yet. After the Cloud Function runs,
        // the onSnapshot listener or a page refresh will pick up the new provider.
      }
    } catch (e: any) {
      console.error("🔴 Save failed:", e);
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
