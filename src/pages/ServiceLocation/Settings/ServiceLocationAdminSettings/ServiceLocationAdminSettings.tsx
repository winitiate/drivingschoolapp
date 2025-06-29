/*  src/pages/ServiceLocation/Settings/ServiceLocationAdminSettings/ServiceLocationAdminSettings.tsx

  ServiceLocationAdminSettings

  • Lists and lets you add Service-Location admins.
  • “Manage” (⚙️) opens UserLifecycleDialog(role="locationAdmin", uid, locationId),
    which now fetches + pre-selects Ban/Deactivate/Reactivate and message automatically.
  • onActionCompleted(action,message?) updates Firestore:
      – “delete” (remove admin)
      – “deactivate” / “ban” (add/remove to *_AdminLocationIds arrays and write lifecycleNotes)
      – “reactivate” (remove from both arrays, clear lifecycleNotes)
  • Afterwards reloads the list.

  Drop in place of your existing file.
*/

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  IconButton,
  CircularProgress,
  Alert,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { ServiceLocation } from "../../../../models/ServiceLocation";
import {
  FirestoreServiceLocationStore,
} from "../../../../data/FirestoreServiceLocationStore";
import type { ServiceLocationStore } from "../../../../data/ServiceLocationStore";

import UserLifecycleDialog from "../../../../components/UserLifecycle/UserLifecycleDialog";

interface AdminProfile {
  uid: string;
  email: string;
  status: "banned" | "deactivated" | null;
  banMessage?: string;
}

export default function ServiceLocationAdminSettings() {
  const { serviceLocationId } = useParams<{
    serviceLocationId: string;
  }>();
  const db = getFirestore();
  const store: ServiceLocationStore = useMemo(
    () => new FirestoreServiceLocationStore(),
    []
  );

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgTarget, setDlgTarget] = useState<AdminProfile | null>(null);

  const load = useCallback(async () => {
    if (!serviceLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const loc = await store.getById(serviceLocationId);
      if (!loc) throw new Error("Service location not found");
      setLocation(loc);

      const profiles: AdminProfile[] = [];
      for (const uid of loc.adminIds ?? []) {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) continue;
        const d = snap.data() as any;

        const bannedArr: string[] =
          d.bannedAdminLocationIds || [];
        const deactArr: string[] =
          d.deactivatedAdminLocationIds || [];

        // lifecycleNotes stored under map or dotted field
        const notesMap = (d.lifecycleNotes as Record<string, any>) || {};
        const dotField = d[`lifecycleNotes.${serviceLocationId}`];
        const noteEntry = notesMap[serviceLocationId] ?? dotField;

        profiles.push({
          uid,
          email: d.email ?? "(no email)",
          status: bannedArr.includes(serviceLocationId)
            ? "banned"
            : deactArr.includes(serviceLocationId)
            ? "deactivated"
            : null,
          banMessage: noteEntry?.msg,
        });
      }
      setAdmins(profiles);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [db, serviceLocationId, store]);

  useEffect(() => {
    load();
  }, [load]);

  const resolveEmailToUid = async (
    email: string
  ): Promise<string | null> => {
    const q = query(
      collection(db, "users"),
      where("email", "==", email.trim().toLowerCase())
    );
    const snaps = await getDocs(q);
    return snaps.empty ? null : snaps.docs[0].id;
  };

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setSaving(true);
    setError(null);
    try {
      let uid =
        (await resolveEmailToUid(email)) ??
        uuidv4();
      if (admins.some((a) => a.uid === uid)) {
        throw new Error("User is already an admin");
      }
      if (!(await resolveEmailToUid(email))) {
        // create stub
        await updateDoc(doc(db, "users", uid), {
          uid,
          email,
          roles: arrayUnion("serviceLocationAdmin"),
          adminLocationIds: arrayUnion(serviceLocationId),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await store.save({
        ...(location as ServiceLocation),
        adminIds: arrayUnion(uid) as any,
      });
      setAdmins((prev) => [
        ...prev,
        { uid, email, status: null },
      ]);
      setNewEmail("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openLifecycle = (admin: AdminProfile) => {
    setDlgTarget(admin);
    setDlgOpen(true);
  };

  const handleLifecycleDone = async (
    action: "ban" | "deactivate" | "reactivate" | "delete",
    message?: string
  ) => {
    setDlgOpen(false);
    if (!dlgTarget) return;
    setSaving(true);
    setError(null);
    try {
      const userRef = doc(db, "users", dlgTarget.uid);

      if (action === "delete") {
        // remove admin
        await store.save({
          ...(location as ServiceLocation),
          adminIds: arrayRemove(dlgTarget.uid) as any,
        });
        await updateDoc(userRef, {
          adminLocationIds: arrayRemove(serviceLocationId),
          updatedAt: serverTimestamp(),
        });
      } else if (action === "deactivate") {
        await updateDoc(userRef, {
          deactivatedAdminLocationIds: arrayUnion(
            serviceLocationId
          ),
          bannedAdminLocationIds: arrayRemove(serviceLocationId),
          [`lifecycleNotes.${serviceLocationId}`]: {
            type: "deactivated",
            msg: message || "",
            at: new Date().toISOString(),
            by: "SYSTEM",
          },
          updatedAt: serverTimestamp(),
        });
      } else if (action === "ban") {
        await updateDoc(userRef, {
          bannedAdminLocationIds: arrayUnion(serviceLocationId),
          deactivatedAdminLocationIds: arrayRemove(
            serviceLocationId
          ),
          [`lifecycleNotes.${serviceLocationId}`]: {
            type: "banned",
            msg: message || "",
            at: new Date().toISOString(),
            by: "SYSTEM",
          },
          updatedAt: serverTimestamp(),
        });
      } else if (action === "reactivate") {
        await updateDoc(userRef, {
          bannedAdminLocationIds: arrayRemove(serviceLocationId),
          deactivatedAdminLocationIds: arrayRemove(
            serviceLocationId
          ),
          [`lifecycleNotes.${serviceLocationId}`]:
            serverTimestamp(), // or omit to clear
          updatedAt: serverTimestamp(),
        });
      }

      await load();
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
        Service-Location Admins
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="New Admin Email"
          type="email"
          fullWidth
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={saving || !newEmail.trim()}
        >
          {saving ? "Adding…" : "Add"}
        </Button>
      </Box>

      <List>
        {admins.map((adm) => (
          <ListItem
            key={adm.uid}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={() => openLifecycle(adm)}
                title="Manage"
              >
                <ManageAccountsIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={adm.email}
              secondary={
                adm.status === "deactivated"
                  ? "Deactivated"
                  : adm.status === "banned"
                  ? `Banned – ${adm.banMessage ?? "no reason"}`
                  : "Active"
              }
            />
          </ListItem>
        ))}
      </List>

      {dlgTarget && (
        <UserLifecycleDialog
          open={dlgOpen}
          onClose={() => setDlgOpen(false)}
          onActionCompleted={handleLifecycleDone}
          role="locationAdmin"
          uid={dlgTarget.uid}
          locationId={serviceLocationId!}
        />
      )}
    </Box>
  );
}
