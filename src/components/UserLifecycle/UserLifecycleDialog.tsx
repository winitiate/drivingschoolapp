/**
 * UserLifecycleDialog.tsx
 *
 * Dialog for managing a user’s lifecycle (Ban / Deactivate / Reactivate / Delete)
 * for a given role + location.
 *
 * This version:
 *  1. Uses the same `relationMap` as your Cloud Function, so the UI reads
 *     exactly the same dynamic keys (e.g. `bannedProviderLocationIds`)
 *     that the server writes.
 *  2. Leaves your save logic (setUserLifecycle) untouched.
 *  3. Falls back so messages are loaded whether stored as string or { msg }.
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { setUserLifecycle } from "../../services/api/lifecycle/setUserLifecycle";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import type {
  LifecycleRole,
  LifecycleAction,
} from "../../../../functions-users/src/types/userLifecycle.types";

interface Props {
  open: boolean;
  role: LifecycleRole;
  uid: string;
  locationId: string;
  onClose: () => void;
  onActionCompleted: (action: LifecycleAction, message?: string) => void;
}

export default function UserLifecycleDialog({
  open,
  role,
  uid,
  locationId,
  onClose,
  onActionCompleted,
}: Props) {
  // ─── Local UI state ───────────────────────────────────────────────────────────
  const [action, setAction] = useState<LifecycleAction>("reactivate");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show the message field when banning or deactivating:
  const showMessageField = action === "ban" || action === "deactivate";
  const requireMessage = action === "ban";

  // ─── Map roles → their “relation array” key ───────────────────────────────────
  // This mirrors exactly your backend’s map in userLifecycle.service.ts
  const relationMap: Record<LifecycleRole, string> = {
    client: "clientLocationIds",
    serviceProvider: "providerLocationIds",
    locationAdmin: "adminLocationIds",
    businessOwner: "ownedBusinessIds",
  };

  // ─── Load current status & message when dialog opens ──────────────────────────
  useEffect(() => {
    if (!open) return;

    (async () => {
      setError(null);
      try {
        const db = getFirestore();
        const snap = await getDoc(doc(db, "users", uid));
        const u = snap.exists() ? (snap.data() as any) : {};

        // Derive the dynamic field names using the same logic as your Cloud Function:
        const relKey = relationMap[role]; // e.g. "providerLocationIds"
        const bannedField =
          "banned" + relKey[0].toUpperCase() + relKey.slice(1);
        const deactField =
          "deactivated" + relKey[0].toUpperCase() + relKey.slice(1);

        // Read the arrays (empty if missing):
        const bannedArr: string[] = Array.isArray(u[bannedField])
          ? u[bannedField]
          : [];
        const deactArr: string[] = Array.isArray(u[deactField])
          ? u[deactField]
          : [];

        // Pull the raw note (could be string or { msg, ... }):
        const notesMap: Record<string, any> = u.lifecycleNotes || {};
        const dotField = u[`lifecycleNotes.${locationId}`];
        const rawNote = notesMap[locationId] ?? dotField;

        // Figure out which action to pre-select:
        let derived: LifecycleAction = "reactivate";
        if (bannedArr.includes(locationId)) derived = "ban";
        else if (deactArr.includes(locationId)) derived = "deactivate";

        // Normalize message whether it’s a bare string or has a .msg property:
        const initialMsg =
          typeof rawNote === "string" ? rawNote : rawNote?.msg ?? "";

        setAction(derived);
        setMessage(initialMsg);
      } catch (e: any) {
        console.error("Error loading lifecycle:", e);
        setError(e.message || "Failed to load status.");
      }
    })();
  }, [open, role, uid, locationId]);

  // ─── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setBusy(true);
    setError(null);

    try {
      await setUserLifecycle({
        uid,
        role,
        locationId,
        action,
        msg: message.trim() || undefined,
      });
      onActionCompleted(action, message.trim() || undefined);
      onClose();
    } catch (e: any) {
      console.error("Error saving lifecycle:", e);
      setError(e.message || "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Life-cycle</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <RadioGroup
          value={action}
          onChange={(e) => setAction(e.target.value as LifecycleAction)}
        >
          <FormControlLabel value="ban" control={<Radio />} label="Ban" />
          <FormControlLabel
            value="deactivate"
            control={<Radio />}
            label="Deactivate"
          />
          <FormControlLabel
            value="reactivate"
            control={<Radio />}
            label="Reactivate"
          />
          <FormControlLabel value="delete" control={<Radio />} label="Delete" />
        </RadioGroup>

        {showMessageField && (
          <TextField
            label="Message shown to the user"
            fullWidth
            multiline
            minRows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mt: 2 }}
            error={requireMessage && !message.trim()}
            helperText={
              requireMessage && !message.trim()
                ? "A message is required when banning."
                : undefined
            }
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Close
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSave}
          disabled={busy || (requireMessage && !message.trim())}
        >
          {busy ? (
            <Box display="flex" alignItems="center">
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving…
            </Box>
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
