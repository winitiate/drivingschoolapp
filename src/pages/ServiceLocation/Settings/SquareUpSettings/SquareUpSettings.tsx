/**
 * SquareUpSettings.tsx
 *
 * Renders a form for configuring SquareUp payment credentials for a
 * service location. On mount, it:
 *   • Loads any existing Firestore PaymentCredential for this location
 *     (by provider="square", ownerType="serviceLocation", ownerId=serviceLocationId).
 *   • Decrypts and populates the form fields:
 *       – applicationId (public)
 *       – accessToken   (secret)
 *       – locationId    (public, required by the Web SDK)
 *
 * On save, it:
 *   • Builds a PaymentCredential object including:
 *       – id (for updates) or undefined (for new docs)
 *       – provider="square", ownerType="serviceLocation", ownerId=serviceLocationId
 *       – toBeUsedBy=serviceLocationId
 *       – credentials: { applicationId, accessToken, locationId }
 *       – createdAt timestamp (preserved on updates)
 *   • Calls store.save(updatedCredential) to upsert in Firestore,
 *     encrypting the accessToken at rest.
 *
 * This form ensures we collect **all three** fields the front end
 * needs to initialize Square’s Web SDK (applicationId + locationId)
 * as well as the secret accessToken that only Functions will decrypt.
 */

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

import { PaymentCredential } from "../../../../models/PaymentCredential";
import { PaymentCredentialStore } from "../../../../data/PaymentCredentialStore";
import { FirestorePaymentCredentialStore } from "../../../../data/FirestorePaymentCredentialStore";

export default function SquareUpSettings() {
  // Pull the serviceLocationId from the route params
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Memoize our Firestore-backed store instance
  const store: PaymentCredentialStore = useMemo(
    () => new FirestorePaymentCredentialStore(),
    []
  );

  // Local state: the loaded or new credential record
  const [credential,    setCredential]    = useState<PaymentCredential | null>(null);
  // Form fields for all three values
  const [appId,         setAppId]         = useState<string>("");
  const [accessToken,   setAccessToken]   = useState<string>("");
  const [locationId,    setLocationId]    = useState<string>("");

  // Loading / saving / error states
  const [loading,       setLoading]       = useState<boolean>(true);
  const [saving,        setSaving]        = useState<boolean>(false);
  const [error,         setError]         = useState<string | null>(null);

  // On mount / whenever serviceLocationId changes, load existing credential
  useEffect(() => {
    if (!serviceLocationId) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch by provider/ownerType/ownerId & toBeUsedBy=serviceLocationId
        const existing = await store.getByOwner(
          "square",
          "serviceLocation",
          serviceLocationId
        );

        if (existing) {
          setCredential(existing);
          setAppId(existing.credentials.applicationId || "");
          setAccessToken(existing.credentials.accessToken || "");
          // New field: locationId must have been stored unencrypted
          setLocationId((existing.credentials as any).locationId || "");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  // When the user clicks “Save”
  const handleSave = async () => {
    if (!serviceLocationId) return;

    setSaving(true);
    setError(null);

    try {
      // Build the upsert object
      const updated: PaymentCredential = {
        // Preserve id for updates, or leave undefined to create new
        id:          credential?.id,
        provider:    "square",
        ownerType:   "serviceLocation",
        ownerId:     serviceLocationId,
        toBeUsedBy:  serviceLocationId,
        credentials: {
          applicationId: appId,
          accessToken,          // will be encrypted by FirestorePaymentCredentialStore
          locationId,           // new public field
        },
        // Preserve createdAt if updating
        createdAt:    credential?.createdAt,
      };

      // Upsert into Firestore
      await store.save(updated);

      // Reflect saved state in the form
      setCredential(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Show spinner while loading
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        SquareUp Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Square Application ID"
        fullWidth
        margin="normal"
        value={appId}
        onChange={(e) => setAppId(e.target.value)}
      />

      <TextField
        label="Square Location ID"
        fullWidth
        margin="normal"
        helperText="Public location identifier for Square Web SDK"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
      />

      <TextField
        label="Square Access Token"
        fullWidth
        margin="normal"
        type="password"
        helperText="Secret token (will be encrypted in Firestore)"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
      />

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save SquareUp Settings"}
        </Button>
      </Box>
    </Box>
  );
}
