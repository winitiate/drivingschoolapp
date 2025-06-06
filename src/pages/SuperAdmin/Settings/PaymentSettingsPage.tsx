// src/pages/SuperAdmin/Settings/PaymentSettingsPage.tsx

import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { useAuth } from "../../../auth/useAuth";
import { FirestorePaymentCredentialStore } from "../../../data/FirestorePaymentCredentialStore";
import type { PaymentCredential } from "../../../models/PaymentCredential";
import { useForm, Controller } from "react-hook-form";

export default function PaymentSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loadingCred, setLoadingCred] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [credentialId, setCredentialId] = useState<string | undefined>(undefined);

  const paymentStore = new FirestorePaymentCredentialStore();

  const { control, handleSubmit, reset } = useForm<{
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  }>({
    defaultValues: { publishableKey: "", secretKey: "", webhookSecret: "" },
  });

  // Load existing credential on mount
  useEffect(() => {
    if (!authLoading && user) {
      (async () => {
        setLoadingCred(true);
        setError(null);
        try {
          // Only one “platform” credential—SuperAdmin’s ID
          const existing = await paymentStore.getByOwner(
            "stripe",
            "platform",
            user.uid
          );
          if (existing) {
            setCredentialId(existing.id!);
            reset({
              publishableKey: existing.credentials.publishableKey || "",
              secretKey: existing.credentials.secretKey || "",
              webhookSecret: existing.credentials.webhookSecret || "",
            });
          }
        } catch (e: any) {
          setError(e.message || "Failed to load Stripe credentials");
        } finally {
          setLoadingCred(false);
        }
      })();
    }
  }, [authLoading, user, paymentStore, reset]);

  const onSubmit = async (data: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  }) => {
    setSaving(true);
    setError(null);
    try {
      await paymentStore.save({
        id: credentialId,
        provider: "stripe",
        ownerType: "platform",
        ownerId: user!.uid,
        credentials: {
          publishableKey: data.publishableKey.trim(),
          secretKey: data.secretKey.trim(),
          webhookSecret: data.webhookSecret.trim(),
        },
        // createdAt / updatedAt are handled inside save()
      });
      // After saving, refetch or just show a success message
    } catch (e: any) {
      setError(e.message || "Failed to save Stripe credentials");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingCred) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Stripe Payment Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, maxWidth: 600 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="publishableKey"
            control={control}
            rules={{ required: "Publishable key is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Publishable Key"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />

          <Controller
            name="secretKey"
            control={control}
            rules={{ required: "Secret key is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Secret Key"
                type="password"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />

          <Controller
            name="webhookSecret"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Webhook Signing Secret (optional)"
                type="password"
                fullWidth
                margin="normal"
                disabled={saving}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : "Save Settings"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
