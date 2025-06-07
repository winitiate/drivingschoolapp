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
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  FormLabel,
  FormControl,
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

interface FormValues {
  title: string;
  description: string;
  priceDollars: string;
  maxLocations: string;
  maxProviders: string;
  maxClients: string;
  visible: boolean;
  callToAction: "register" | "contact";
}

export default function SubscriptionPackageFormPage() {
  const { id: pkgId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const db = getFirestore();

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
      visible: true,
      callToAction: "register",
    },
  });

  useEffect(() => {
    if (!pkgId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // define collRef inside effect so it doesn't recreate each render
        const collRef = collection(db, "subscriptionPackages");
        const docRef = doc(collRef, pkgId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError("Subscription package not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() as DocumentData;
        reset({
          title: data.title || "",
          description: data.description || "",
          priceDollars: ((data.priceCents ?? 0) / 100).toFixed(2),
          maxLocations: (data.maxLocations ?? "").toString(),
          maxProviders: (data.maxProviders ?? "").toString(),
          maxClients: (data.maxClients ?? "").toString(),
          visible: data.visible ?? true,
          callToAction: data.callToAction ?? "register",
        });
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load package");
      } finally {
        setLoading(false);
      }
    })();
    // only rerun when pkgId, db, or reset change
  }, [pkgId, db, reset]);

  const onSubmit = async (vals: FormValues) => {
    setSaving(true);
    setError(null);
    try {
      // parse & validate
      const price = parseFloat(vals.priceDollars);
      if (isNaN(price) || price < 0)
        throw new Error("Price must be a non-negative number");
      const priceCents = Math.round(price * 100);

      const maxLoc = parseInt(vals.maxLocations, 10);
      const maxProv = parseInt(vals.maxProviders, 10);
      if (isNaN(maxLoc) || maxLoc < 0)
        throw new Error("Max Locations must be a non-negative integer");
      if (isNaN(maxProv) || maxProv < 0)
        throw new Error("Max Providers must be a non-negative integer");

      let maxCl: number | null = null;
      if (vals.maxClients.trim()) {
        const c = parseInt(vals.maxClients, 10);
        if (isNaN(c) || c < 0)
          throw new Error("Max Clients must be a non-negative integer");
        maxCl = c;
      }

      // build payload
      const payload: any = {
        title: vals.title.trim(),
        description: vals.description.trim(),
        priceCents,
        maxLocations: maxLoc,
        maxProviders: maxProv,
        maxClients: maxCl,
        visible: vals.visible,
        callToAction: vals.callToAction,
        updatedAt: serverTimestamp(),
      };
      if (!pkgId) {
        payload.createdAt = serverTimestamp();
      }

      // docRef
      const collRef = collection(db, "subscriptionPackages");
      const docRef = pkgId ? doc(collRef, pkgId) : doc(collRef);

      await setDoc(docRef, payload, { merge: true });
      navigate("/super-admin/subscription-packages");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Save failed");
      setSaving(false);
    }
  };

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
                !isNaN(parseFloat(v)) || "Must be a number",
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

          <Grid container spacing={2}>
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

          <FormControlLabel
            control={
              <Controller
                name="visible"
                control={control}
                render={({ field }) => (
                  <Switch {...field} checked={field.value} />
                )}
              />
            }
            label="Visible on Pricing Page"
          />

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Call to Action</FormLabel>
            <Controller
              name="callToAction"
              control={control}
              render={({ field }) => (
                <RadioGroup row {...field}>
                  <FormControlLabel
                    value="register"
                    control={<Radio />}
                    label="Register Now"
                  />
                  <FormControlLabel
                    value="contact"
                    control={<Radio />}
                    label="Contact for a Quote"
                  />
                </RadioGroup>
              )}
            />
          </FormControl>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} /> : undefined
              }
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/super-admin/subscription-packages")}
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
