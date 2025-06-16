/**
 * SquareUpSettings.tsx
 *
 * Renders a form for configuring SquareUp payment credentials for a
 * service location. On mount, it attempts to fetch an existing credential
 * record from Firestore (by provider, ownerType, ownerId). The form is
 * populated with the retrieved application ID and access token.
 *
 * On save, if an existing document ID is present, it updates that document;
 * otherwise, it creates a new one. A "toBeUsedBy" field is included in the
 * Firestore record to link these credentials to the specified service location.
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
  // Extract the serviceLocationId from the URL parameters
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  // Initialize our Firestore-backed store for payment credentials
  const store: PaymentCredentialStore = useMemo(
    () => new FirestorePaymentCredentialStore(),
    []
  );

  // Local state for the credential record and form fields
  const [credential, setCredential] = useState<PaymentCredential | null>(null);
  const [appId, setAppId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // On component mount or whenever the serviceLocationId changes,
  // attempt to load the existing credential document.
  useEffect(() => {
    if (!serviceLocationId) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Attempt to fetch existing credential by provider, ownerType, and ownerId
        const existing = await store.getByOwner(
          "square",
          "serviceLocation",
          serviceLocationId
        );

        // If a record exists, populate our form fields
        if (existing) {
          setCredential(existing);
          setAppId(existing.credentials.applicationId || "");
          setAccessToken(existing.credentials.accessToken || "");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  // Handler to save (create or update) the credential record
  const handleSave = async () => {
    if (!serviceLocationId) return;

    setSaving(true);
    setError(null);

    try {
      // Build the PaymentCredential object
      const updated: PaymentCredential = {
        // Include the existing document ID for updates; undefined for new records
        id: credential?.id,
        provider: "square",
        ownerType: "serviceLocation",
        ownerId: serviceLocationId,
        // New field linking this credential to the location that will use it
        toBeUsedBy: serviceLocationId,
        credentials: {
          applicationId: appId,
          accessToken,
        },
        // Preserve original creation timestamp if present
        createdAt: credential?.createdAt,
      };

      // Persist to Firestore: updating if `id` exists, else creating a new doc
      await store.save(updated);

      // Update local state with the saved record
      setCredential(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Show a loading spinner while fetching initial data
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Main form rendering
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
        label="Square Access Token"
        fullWidth
        margin="normal"
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
