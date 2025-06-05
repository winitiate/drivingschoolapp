// src/pages/SuperAdmin/BusinessManagement/BusinessFormDialog.tsx

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  Box,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import type { Business } from "../../../models/Business";
import { db } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  doc,
  setDoc,
  arrayUnion,
} from "firebase/firestore";
import BusinessForm from "../../../components/BusinessForm/BusinessForm";

interface Props {
  open: boolean;
  onClose: () => void;
  business?: Business | null;
  onSaved: () => void;
}

// Recursively strip out any `undefined` fields (and nested undefineds):
function deepCleanObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepCleanObject);
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCleanObject(v)])
    );
  }
  return obj;
}

export default function BusinessFormDialog({
  open,
  onClose,
  business,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);

  // Initialize react-hook-form
  const methods = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      status: "active",
      notes: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // When `business` prop changes, populate the form fields
  useEffect(() => {
    if (!business) {
      // Creating new → reset to empty defaults
      reset({
        name: "",
        email: "",
        phone: "",
        website: "",
        status: "active",
        notes: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
      });
      return;
    }

    // Editing existing business → load its values
    reset({
      name: business.name || "",
      email: business.email || "",
      phone: business.phone || "",
      website: business.website || "",
      status: business.status || "active",
      notes: business.notes || "",
      address: {
        street: business.address?.street || "",
        city: business.address?.city || "",
        state: business.address?.state || "",
        zipCode: business.address?.zipCode || "",
        country: business.address?.country || "",
      },
      ownerName: business.ownerName || "",
      ownerEmail: business.ownerEmail || "",
      ownerPhone: business.ownerPhone || "",
    });
  }, [business, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // 1) Determine business ID
      const bizId = business?.id || uuidv4();
      const isEdit = Boolean(business);

      // 2) If ownerEmail provided, look up that user’s UID (ownerId).
      //    If not found, create a placeholder user with role "business".
      let ownerId: string | undefined;
      if (data.ownerEmail?.trim()) {
        const emailLower = data.ownerEmail.trim().toLowerCase();
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", emailLower)
        );
        const snaps = await getDocs(userQuery);
        if (!snaps.empty) {
          // Found existing user
          ownerId = snaps.docs[0].id;
        } else {
          // Create placeholder user
          ownerId = uuidv4();
          await setDoc(doc(db, "users", ownerId), {
            uid: ownerId,
            email: emailLower,
            firstName: data.ownerName?.trim() || "",
            lastName: "",
            roles: ["business"],
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

      // 3) Build a minimal payload containing only non‐empty fields + timestamps
      const payload: any = {
        name: data.name.trim(),
        email: data.email.trim(),
        status: data.status,
        updatedAt: serverTimestamp(),
      };

      if (data.phone?.trim()) payload.phone = data.phone.trim();
      if (data.website?.trim()) payload.website = data.website.trim();
      if (data.notes?.trim()) payload.notes = data.notes.trim();

      // Address sub‐object
      const addr = data.address || {};
      const addressPayload: any = {};
      if (addr.street?.trim()) addressPayload.street = addr.street.trim();
      if (addr.city?.trim()) addressPayload.city = addr.city.trim();
      if (addr.state?.trim()) addressPayload.state = addr.state.trim();
      if (addr.zipCode?.trim()) addressPayload.zipCode = addr.zipCode.trim();
      if (addr.country?.trim()) addressPayload.country = addr.country.trim();
      if (Object.keys(addressPayload).length > 0) {
        payload.address = addressPayload;
      }

      // Owner info
      if (data.ownerName?.trim()) payload.ownerName = data.ownerName.trim();
      if (data.ownerEmail?.trim()) payload.ownerEmail = data.ownerEmail.trim();
      if (data.ownerPhone?.trim()) payload.ownerPhone = data.ownerPhone.trim();
      if (ownerId) {
        payload.ownerId = ownerId;
      }

      if (!isEdit) {
        payload.createdAt = serverTimestamp();
      }

      // 4) Deep‐clean out any remaining undefined values
      const cleanedPayload = deepCleanObject(payload);

      // 5) Write directly to Firestore
      if (isEdit) {
        await updateDoc(doc(db, "businesses", bizId), cleanedPayload);
      } else {
        await setDoc(doc(db, "businesses", bizId), cleanedPayload);
      }

      // 6) If we found or created an ownerId, patch that user’s doc to include this business
      if (ownerId) {
        const userRef = doc(db, "users", ownerId);
        await updateDoc(userRef, {
          roles: arrayUnion("business"),
          ownedBusinessIds: arrayUnion(bizId),
          updatedAt: serverTimestamp(),
        });
      }

      // 7) Callback to parent & close
      onSaved();
    } catch (err: any) {
      console.error("Error saving business:", err);
      alert(err.message || "Failed to save business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{business ? "Edit Business" : "New Business"}</DialogTitle>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} mt={1}>
              {/* 
                BusinessForm internally uses `useFormContext()` and its own Controllers, 
                so we simply render it here without passing `control` or `errors`. 
              */}
              <BusinessForm />
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} type="button" disabled={isSubmitting || loading}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <CircularProgress size={20} />
              ) : business ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>

      {/* Overlay spinner while saving */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Dialog>
  );
}
