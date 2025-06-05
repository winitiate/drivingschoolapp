// src/pages/ServiceProvider/ServiceProviderFormDialog.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import type { ServiceProvider } from "../../models/ServiceProvider";
import ServiceProviderForm from "../../components/ServiceProviders/ServiceProviderForm";

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData?: ServiceProvider;
  onClose: () => void;
  /**
   * The Manager (parent component) does the actual save to Firestore.
   * We simply hand it a fully-formed ServiceProvider object to persist.
   *
   * This callback is responsible for calling FirestoreServiceProviderStore.save(...).
   */
  onSave: (provider: ServiceProvider) => void;
}

export default function ServiceProviderFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local “form” state (partial ServiceProvider). We will assemble
  // a full ServiceProvider only when the user clicks “Create/Save”.
  const [form, setForm] = useState<Partial<ServiceProvider>>({
    id: undefined,
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    licenseNumber: "",
    licenseClass: "",
    address: { street: "", city: "", postalCode: "" },
    backgroundCheck: { date: new Date(), status: "pending" },
    rating: { average: 0, reviewCount: 0 },
    availability: [],
    blockedTimes: [],
    vehiclesCertifiedFor: [],
    providerLocationIds: [], // ← will be merged with serviceLocationId below
  });

  // Whenever the dialog opens, initialize or reset the form:
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      // Editing an existing provider → copy its entire shape
      setForm({
        ...initialData,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        providerLocationIds: initialData.providerLocationIds || [],
        licenseNumber: initialData.licenseNumber || "",
        licenseClass: initialData.licenseClass || "",
        address: {
          ...(initialData.address || { street: "", city: "", postalCode: "" }),
        },
        backgroundCheck: initialData.backgroundCheck || {
          date: new Date(),
          status: "pending",
        },
        rating: initialData.rating || { average: 0, reviewCount: 0 },
        availability: initialData.availability || [],
        blockedTimes: initialData.blockedTimes || [],
        vehiclesCertifiedFor: initialData.vehiclesCertifiedFor || [],
      });
    } else {
      // Adding a new provider → clear all fields
      setForm({
        id: undefined,
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        licenseNumber: "",
        licenseClass: "",
        address: { street: "", city: "", postalCode: "" },
        backgroundCheck: { date: new Date(), status: "pending" },
        rating: { average: 0, reviewCount: 0 },
        availability: [],
        blockedTimes: [],
        vehiclesCertifiedFor: [],
        providerLocationIds: [],
      });
    }

    setError(null);
  }, [open, initialData]);

  // Called by <ServiceProviderForm …> whenever any field changes:
  const handleFormChange = (
    data: Partial<ServiceProvider> & {
      email?: string;
      firstName?: string;
      lastName?: string;
    }
  ) => {
    setForm((f) => ({ ...f, ...data }));
  };

  // Called when user clicks “Create” or “Save Changes”:
  const handleSubmit = async () => {
    setBusy(true);
    setError(null);

    try {
      // ──────────── STEP 1: Resolve (or create) the /users/{uid} by matching email ────────────
      const email = (form.email || "").trim().toLowerCase();
      let uid = form.userId || "";

      if (email) {
        const usersCol = collection(db, "users");
        const snap = await getDocs(query(usersCol, where("email", "==", email)));

        if (!snap.empty) {
          // Found an existing user doc for that email
          uid = snap.docs[0].id;
        } else {
          // No user doc with this email yet ⇒ create a “placeholder” user
          uid = uuidv4();
          await setDoc(doc(db, "users", uid), {
            uid,
            email,
            firstName: form.firstName || "",
            lastName: form.lastName || "",
            roles: ["serviceProvider"], // since the admin is explicitly adding
            ownedBusinessIds: [],
            memberBusinessIds: [],
            ownedLocationIds: [],
            adminLocationIds: [],
            providerLocationIds: [],
            clientLocationIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // ──────────── STEP 2: Patch that /users/{uid} to ensure they have
      //                     serviceProvider role and are linked to this location ────────────
      await updateDoc(doc(db, "users", uid), {
        firstName: form.firstName || "",
        lastName: form.lastName || "",
        providerLocationIds: arrayUnion(serviceLocationId),
        roles: arrayUnion("serviceProvider"),
        updatedAt: serverTimestamp(),
      });

      // ──────────── STEP 3: Build a “complete” ServiceProvider object ────────────
      // If editing, re‐use initialData.id; otherwise generate a new ID.
      const providerId = isEdit
        ? (form.id as string)
        : uuidv4();

      const nowTimestamp = serverTimestamp() as any; // Firestore server timestamp

      const fullProvider: ServiceProvider = {
        // Start with anything the admin previously filled in:
        ...(form as ServiceProvider),

        // Overwrite/ensure these fields exist:
        id: providerId,
        userId: uid,
        firstName: form.firstName || "",
        lastName: form.lastName || "",
        email,
        licenseNumber: form.licenseNumber || "",
        licenseClass: form.licenseClass || "",
        address: form.address || { street: "", city: "", postalCode: "" },
        backgroundCheck: form.backgroundCheck || {
          date: new Date(),
          status: "pending",
        },
        rating: form.rating || { average: 0, reviewCount: 0 },
        availability: form.availability || [],
        blockedTimes: form.blockedTimes || [],
        vehiclesCertifiedFor: form.vehiclesCertifiedFor || [],

        // —————————————————————————————————————————————————————————————————
        // IMPORTANT: Ensure our `providerLocationIds` array contains
        // the current serviceLocationId. This is the field that the
        // Firestore rule will check against the admin’s own locations.
        providerLocationIds: Array.from(
          new Set([
            ...(form.providerLocationIds || []),
            serviceLocationId,
          ])
        ),
        // —————————————————————————————————————————————————————————————————

        // Timestamps (createdAt only if editing; otherwise now)
        createdAt: isEdit ? (form.createdAt as any) : nowTimestamp,
        updatedAt: nowTimestamp,
      };

      // ──────────── STEP 4: Hand the “complete” provider object back to the Manager ────────────
      // (Manager will actually call `.save(...)` exactly once.)
      onSave(fullProvider);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save provider");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <DialogTitle>
        {isEdit ? "Edit Service Provider" : "Add Service Provider"}
      </DialogTitle>
      <DialogContent dividers>
        <ServiceProviderForm form={form} onChange={handleFormChange} />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? (
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving…
            </Box>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
