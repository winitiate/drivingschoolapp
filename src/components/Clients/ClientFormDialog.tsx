/*  src/components/Clients/ClientFormDialog.tsx  */

import React, { useState, useEffect, useMemo } from "react";
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
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import type { Client } from "../../models/Client";
import { FirestoreClientStore } from "../../data/FirestoreClientStore";
import ClientForm from "./ClientForm";

import UserLifecycleDialog from "../UserLifecycle/UserLifecycleDialog";

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData?: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

/** ensure a Firestore user doc exists for this email; return its UID */
async function resolveUserByEmail(
  db: ReturnType<typeof getFirestore>,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const norm = email.trim().toLowerCase();
  const usersCol = collection(db, "users");
  const snap = await getDocs(query(usersCol, where("email", "==", norm)));
  if (!snap.empty) return snap.docs[0].id;
  const uid = uuidv4();
  await setDoc(doc(db, "users", uid), {
    uid,
    email: norm,
    firstName,
    lastName,
    roles: ["client"],
    clientLocationIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

export default function ClientFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore();
  const store = useMemo(() => new FirestoreClientStore(), []);
  const isEdit = Boolean(initialData?.id);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manage Status modal
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [lifecycleInit, setLifecycleInit] = useState<{
    status: "active" | "banned" | "deactivated";
    msg: string;
  }>({ status: "active", msg: "" });

  // Client form state
  const [form, setForm] = useState<Partial<Client> & {
    firstName: string;
    lastName: string;
    email: string;
    // …other fields…
  }>({
    firstName: "",
    lastName: "",
    email: "",
  });

  // On dialog open, seed form + lifecycleInit
  useEffect(() => {
    if (!open) return;
    (async () => {
      if (initialData) {
        const uSnap = await getDoc(doc(db, "users", initialData.userId));
        const u = uSnap.exists() ? (uSnap.data() as any) : {};

        const nested = u.lifecycleNotes as Record<string, any> | undefined;
        const note =
          nested?.[serviceLocationId] ??
          u[`lifecycleNotes.${serviceLocationId}`] ??
          undefined;

        const bannedArr: string[] = u.bannedClientLocationIds || [];
        const deactArr: string[] = u.deactivatedClientLocationIds || [];
        let status: "active" | "banned" | "deactivated" = "active";
        if (bannedArr.includes(serviceLocationId)) status = "banned";
        else if (deactArr.includes(serviceLocationId)) status = "deactivated";

        setLifecycleInit({ status, msg: note?.msg ?? "" });

        setForm({
          id: initialData.id,
          userId: initialData.userId,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          // …populate other fields from initialData…
        });
      } else {
        setForm({ firstName: "", lastName: "", email: "" });
        setLifecycleInit({ status: "active", msg: "" });
      }
      setError(null);
    })();
  }, [open, initialData, db, serviceLocationId]);

  // Fetch status+message once when opening Manage Status
  const handleOpenLifecycle = async () => {
    if (initialData) {
      const uSnap = await getDoc(doc(db, "users", initialData.userId));
      const u = uSnap.exists() ? (uSnap.data() as any) : {};

      const nested = u.lifecycleNotes as Record<string, any> | undefined;
      const note =
        nested?.[serviceLocationId] ??
        u[`lifecycleNotes.${serviceLocationId}`] ??
        undefined;

      const bannedArr: string[] = u.bannedClientLocationIds || [];
      const deactArr: string[] = u.deactivatedClientLocationIds || [];
      let status: "active" | "banned" | "deactivated" = "active";
      if (bannedArr.includes(serviceLocationId)) status = "banned";
      else if (deactArr.includes(serviceLocationId)) status = "deactivated";

      setLifecycleInit({ status, msg: note?.msg ?? "" });
    }
    setLifecycleOpen(true);
  };

  const handleFormChange = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  // Save client
  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const uid = await resolveUserByEmail(
        db,
        form.email,
        form.firstName,
        form.lastName
      );
      await updateDoc(doc(db, "users", uid), {
        clientLocationIds: arrayUnion(serviceLocationId),
        roles: arrayUnion("client"),
        updatedAt: serverTimestamp(),
      });

      const clientLocationIds = Array.from(
        new Set([...(initialData?.clientLocationIds || []), serviceLocationId])
      );
      const id = isEdit ? initialData!.id : uuidv4();

      const client: Client = {
        id,
        userId: uid,
        clientLocationIds,
        // …populate from form…
      };

      await store.save(client);
      onSave(client);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save client");
    } finally {
      setBusy(false);
    }
  };

  // After lifecycle action succeeds
  const handleLifecycleAction = (
    action: "ban" | "deactivate" | "reactivate" | "delete",
    message?: string
  ) => {
    setLifecycleOpen(false);
    if (initialData) {
      onSave({ ...initialData, updatedAt: new Date() } as Client);
    }
  };

  if (!open) return null;
  return (
    <>
      <Dialog open fullWidth maxWidth="md" onClose={onClose}>
        <DialogTitle>
          {isEdit ? "Edit Client" : "Add Client"}
        </DialogTitle>
        <DialogContent dividers>
          <ClientForm form={form} onChange={handleFormChange} />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button onClick={onClose} disabled={busy}>
            Close
          </Button>
          {isEdit && (
            <Button
              color="secondary"
              onClick={handleOpenLifecycle}
              disabled={busy}
            >
              Manage Status
            </Button>
          )}
          <Button
            variant="contained"
            disabled={busy}
            onClick={handleSubmit}
          >
            {busy ? (
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving…
              </Box>
            ) : isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {isEdit && (
        <UserLifecycleDialog
          open={lifecycleOpen}
          onClose={() => setLifecycleOpen(false)}
          onActionCompleted={handleLifecycleAction}
          role="client"
          uid={initialData!.userId}
          locationId={serviceLocationId}
          initialAction={
            lifecycleInit.status === "banned"
              ? "ban"
              : lifecycleInit.status === "deactivated"
              ? "deactivate"
              : "reactivate"
          }
          initialMessage={lifecycleInit.msg}
        />
      )}
    </>
  );
}
