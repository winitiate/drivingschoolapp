// src/pages/ServiceLocation/Settings/SquareUpSettings/SquareUpSettings.tsx

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
  const { serviceLocationId } = useParams<{ serviceLocationId: string }>();

  const store: PaymentCredentialStore = useMemo(
    () => new FirestorePaymentCredentialStore(),
    []
  );

  const [credential, setCredential] = useState<PaymentCredential | null>(null);
  const [appId, setAppId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceLocationId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cred = await store.getByOwner("square", "serviceLocation", serviceLocationId);
        setCredential(cred);
        setAppId(cred?.credentials?.applicationId || "");
        setAccessToken(cred?.credentials?.accessToken || "");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceLocationId, store]);

  const handleSave = async () => {
    if (!serviceLocationId) return;
    setSaving(true);
    setError(null);
    try {
      const updated: PaymentCredential = {
        id: credential?.id,
        provider: "square",
        ownerType: "serviceLocation",
        ownerId: serviceLocationId,
        credentials: {
          applicationId: appId,
          accessToken,
        },
        createdAt: credential?.createdAt,
      };
      await store.save(updated);
      setCredential(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

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
        label="Square Access Token"
        fullWidth
        margin="normal"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
      />

      <Box mt={2}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save SquareUp Settings"}
        </Button>
      </Box>
    </Box>
  );
}
