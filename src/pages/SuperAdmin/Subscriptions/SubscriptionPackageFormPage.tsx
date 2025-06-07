// src/pages/SuperAdmin/Subscriptions/SubscriptionPackageFormPage.tsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import type { SubscriptionPackage } from "../../../models/SubscriptionPackage";

interface FormValues {
  title: string;
  description: string;
  priceDollars: string;
  maxLocations: string;
  maxProviders: string;
  maxClients: string;
}

export default function SubscriptionPackageFormPage() {
  const { id: pkgId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const db = getFirestore();
  const collRef = collection(db, "subscriptionPackages");

  const [loading, setLoading] = useState<boolean>(!!pkgId);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      priceDollars: "",
      maxLocations: "",
      maxProviders: "",
      maxClients: "",
    },
  });

  // Load existing package if editing
  useEffect(() => {
    if (!pkgId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ref = doc(collRef, pkgId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Subscription package not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() as DocumentData;
        reset({
          title: data.title || "",
          description: data.description || "",
          priceDollars: (data.priceCents / 100).toFixed(2),
          maxLocations: (data.maxLocations ?? 0).toString(),
          maxProviders: (data.maxProviders ?? 0).toString(),
          maxClients:
            data.maxClients != null ? data.maxClients.toString() : "",
        });
      } catch (err: any) {
        console.error("Error loading package:", err);
        setError(err.message || "Failed to load subscription package.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkgId]);

  const onSubmit = async (form: FormValues) => {
    setSaving(true);
    setError(null);

    try {
      // Convert & validate price
      const price = parseFloat(form.priceDollars);
      if (isNaN(price) || price < 0) {
        throw new Error("Price must be a non-negative number.");
      }
      const priceCents = Math.round(price * 100);

      // Convert & validate limits
      const maxLoc = parseInt(form.maxLocations, 10);
      if (isNaN(maxLoc) || maxLoc < 0) {
        throw new Error("Max Locations must be non-negative integer.");
      }
      const maxProv = parseInt(form.maxProviders, 10);
      if (isNaN(maxProv) || maxProv < 0) {
        throw new Error("Max Providers must be non-negative integer.");
      }

      let maxCl: number | null = null;
      if (form.maxClients.trim() !== "") {
        const val = parseInt(form.maxClients, 10);
        if (isNaN(val) || val < 0) {
          throw new Error("Max Clients must be non-negative integer.");
        }
        maxCl = val;
      }

      // Build payload
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        priceCents,
        maxLocations: maxLoc,
        maxProviders: maxProv,
        updatedAt: serverTimestamp(),
      };
      if (maxCl !== null) payload.maxClients = maxCl;
      if (!pkgId) payload.createdAt = serverTimestamp();

      // Determine docRef
      const docRef = pkgId
        ? doc(collRef, pkgId)
        : doc(collRef); // new auto-ID

      await setDoc(docRef, payload, { merge: true });
      navigate("/super-admin/subscription-packages");
    } catch (err: any) {
      console.error("Error saving package:", err);
      setError(err.message || "Failed to save subscription package.");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/super-admin/subscription-packages");
  };

  // Loading spinner
  if (loading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {pkgId ? "Edit Subscription Package" : "New Subscription Package"}
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Title is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Title"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                margin="normal"
                multiline
                minRows={3}
                disabled={saving}
              />
            )}
          />

          <Controller
            name="priceDollars"
            control={control}
            rules={{
              required: "Price is required",
              validate: (v) =>
                !isNaN(parseFloat(v)) || "Price must be a number",
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Price (Dollars)"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="maxLocations"
                control={control}
                rules={{
                  required: "Max Locations is required",
                  validate: (v) =>
                    !isNaN(parseInt(v, 10)) || "Must be an integer",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Max Locations"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={saving}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="maxProviders"
                control={control}
                rules={{
                  required: "Max Providers is required",
                  validate: (v) =>
                    !isNaN(parseInt(v, 10)) || "Must be an integer",
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Max Providers"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={saving}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="maxClients"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Max Clients (optional)"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={saving}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : undefined}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
