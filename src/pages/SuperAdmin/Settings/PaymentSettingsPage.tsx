// src/pages/SuperAdmin/Settings/PaymentSettingsPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../../auth/useAuth";
import { FirestorePaymentCredentialStore } from "../../../data/FirestorePaymentCredentialStore";
import type { PaymentCredential } from "../../../models/PaymentCredential";

/**
 * PaymentSettingsPage
 *
 * Allows the SuperAdmin to configure both Stripe and Square credentials
 * from one place. Uses tabs to switch between providers.
 */
export default function PaymentSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const paymentStore = useMemo(() => new FirestorePaymentCredentialStore(), []);

  // Which tab is active: 0 = Stripe, 1 = Square
  const [tabIndex, setTabIndex] = useState<0 | 1>(0);

  // --- Stripe state ---
  const [loadingStripeCred, setLoadingStripeCred] = useState(true);
  const [errorStripe, setErrorStripe] = useState<string | null>(null);
  const [savingStripe, setSavingStripe] = useState(false);
  const [stripeCredId, setStripeCredId] = useState<string | undefined>();

  const {
    control: ctrlStripe,
    handleSubmit: handleStripeSubmit,
    reset: resetStripeForm,
  } = useForm<{
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  }>({
    defaultValues: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
    },
  });

  // --- Square state ---
  const [loadingSquareCred, setLoadingSquareCred] = useState(true);
  const [errorSquare, setErrorSquare] = useState<string | null>(null);
  const [savingSquare, setSavingSquare] = useState(false);
  const [squareCredId, setSquareCredId] = useState<string | undefined>();

  const {
    control: ctrlSquare,
    handleSubmit: handleSquareSubmit,
    reset: resetSquareForm,
  } = useForm<{
    applicationId: string;
    locationId: string;
    accessToken: string;
    webhookSignatureKey: string;
  }>({
    defaultValues: {
      applicationId: "",
      locationId: "",
      accessToken: "",
      webhookSignatureKey: "",
    },
  });

  // If auth is still loading, show spinner
  if (authLoading) {
    return (
      <Box textAlign="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  // If user is not signed in (should not happen under ProtectedRoute), just render nothing
  if (!user) {
    return null;
  }

  const superAdminUid = user.uid;

  // --- Load Stripe creds once ---
  useEffect(() => {
    let mounted = true;
    setLoadingStripeCred(true);
    setErrorStripe(null);

    paymentStore
      .getByOwner("stripe", "platform", superAdminUid)
      .then((existing) => {
        if (!mounted) return;
        if (existing) {
          setStripeCredId(existing.id!);
          resetStripeForm({
            publishableKey: existing.credentials.publishableKey || "",
            secretKey: existing.credentials.secretKey || "",
            webhookSecret: existing.credentials.webhookSecret || "",
          });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setErrorStripe(err.message || "Failed to load Stripe credentials");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingStripeCred(false);
      });

    return () => {
      mounted = false;
    };
  }, [paymentStore, resetStripeForm, superAdminUid]);

  const onSaveStripe = async (data: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  }) => {
    setSavingStripe(true);
    setErrorStripe(null);

    try {
      await paymentStore.save({
        id: stripeCredId,
        provider: "stripe",
        ownerType: "platform",
        ownerId: superAdminUid,
        credentials: {
          publishableKey: data.publishableKey.trim(),
          secretKey: data.secretKey.trim(),
          webhookSecret: data.webhookSecret.trim(),
        },
      });
    } catch (err: any) {
      setErrorStripe(err.message || "Failed to save Stripe credentials");
    } finally {
      setSavingStripe(false);
    }
  };

  // --- Load Square creds once ---
  useEffect(() => {
    let mounted = true;
    setLoadingSquareCred(true);
    setErrorSquare(null);

    paymentStore
      .getByOwner("square", "platform", superAdminUid)
      .then((existing) => {
        if (!mounted) return;
        if (existing) {
          setSquareCredId(existing.id!);
          resetSquareForm({
            applicationId: existing.credentials.applicationId || "",
            locationId: existing.credentials.locationId || "",
            accessToken: existing.credentials.accessToken || "",
            webhookSignatureKey: existing.credentials.webhookSignatureKey || "",
          });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setErrorSquare(err.message || "Failed to load Square credentials");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingSquareCred(false);
      });

    return () => {
      mounted = false;
    };
  }, [paymentStore, resetSquareForm, superAdminUid]);

  const onSaveSquare = async (data: {
    applicationId: string;
    locationId: string;
    accessToken: string;
    webhookSignatureKey: string;
  }) => {
    setSavingSquare(true);
    setErrorSquare(null);

    try {
      await paymentStore.save({
        id: squareCredId,
        provider: "square",
        ownerType: "platform",
        ownerId: superAdminUid,
        credentials: {
          applicationId: data.applicationId.trim(),
          locationId: data.locationId.trim(),
          accessToken: data.accessToken.trim(),
          webhookSignatureKey: data.webhookSignatureKey.trim(),
        },
      });
    } catch (err: any) {
      setErrorSquare(err.message || "Failed to save Square credentials");
    } finally {
      setSavingSquare(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Payment Settings
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(_, newIndex) => setTabIndex(newIndex as 0 | 1)}
        sx={{ mb: 2 }}
      >
        <Tab label="Stripe" />
        <Tab label="Square" />
      </Tabs>

      {/* ====== STRIPE PANEL ====== */}
      {tabIndex === 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Stripe Configuration
          </Typography>

          {loadingStripeCred ? (
            <Box textAlign="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleStripeSubmit(onSaveStripe)}>
              <Controller
                name="publishableKey"
                control={ctrlStripe}
                rules={{ required: "Publishable key is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Publishable Key"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={savingStripe}
                  />
                )}
              />

              <Controller
                name="secretKey"
                control={ctrlStripe}
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
                    disabled={savingStripe}
                  />
                )}
              />

              <Controller
                name="webhookSecret"
                control={ctrlStripe}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Webhook Signing Secret (optional)"
                    type="password"
                    fullWidth
                    margin="normal"
                    disabled={savingStripe}
                  />
                )}
              />

              {errorStripe && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorStripe}
                </Alert>
              )}

              <Box sx={{ textAlign: "left", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingStripe}
                >
                  {savingStripe ? <CircularProgress size={20} /> : "Save Stripe"}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      )}

      {/* ====== SQUARE PANEL ====== */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Square Configuration
          </Typography>

          {loadingSquareCred ? (
            <Box textAlign="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSquareSubmit(onSaveSquare)}>
              <Controller
                name="applicationId"
                control={ctrlSquare}
                rules={{ required: "Application ID is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Application ID"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={savingSquare}
                  />
                )}
              />

              <Controller
                name="locationId"
                control={ctrlSquare}
                rules={{ required: "Location ID is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Location ID"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={savingSquare}
                  />
                )}
              />

              <Controller
                name="accessToken"
                control={ctrlSquare}
                rules={{ required: "Access token is required" }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Access Token"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={savingSquare}
                  />
                )}
              />

              <Controller
                name="webhookSignatureKey"
                control={ctrlSquare}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Webhook Signature Key (optional)"
                    type="password"
                    fullWidth
                    margin="normal"
                    disabled={savingSquare}
                  />
                )}
              />

              {errorSquare && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorSquare}
                </Alert>
              )}

              <Box sx={{ textAlign: "left", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingSquare}
                >
                  {savingSquare ? <CircularProgress size={20} /> : "Save Square"}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      )}
    </Container>
  );
}
