/*  src/pages/ServiceProvider/ServiceProviderFormDialog.tsx

  ServiceProviderFormDialog

  – Renders a dialog to add or edit a Service Provider.
  – On open, fetches the user’s Firestore doc once to seed both:
      • the form fields
      • lifecycleInit.status & lifecycleInit.msg (saved ban/deactivate info)
  – “Manage Status” button calls handleOpenLifecycle(), which:
      1) re-fetches the same user doc,
      2) derives the saved status & message,
      3) sets lifecycleInit,
      4) then opens UserLifecycleDialog with those initial props.
  – Does NOT modify UserLifecycleDialog itself.
*/

import React, { useEffect, useState } from "react";
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
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import type { ServiceProvider } from "../../models/ServiceProvider";
import { serviceProviderStore } from "../../data";
import ServiceProviderForm from "../../components/ServiceProviders/ServiceProviderForm";

import {
  createServiceProvider,
  CreateServiceProviderInput,
} from "../../services";

import UserLifecycleDialog from "../../components/UserLifecycle/UserLifecycleDialog";

interface Props {
  open: boolean;
  serviceLocationId: string;
  initialData?: ServiceProvider;
  onClose: () => void;
  onSave: (provider: ServiceProvider) => void;
}

/** Ensure a Firestore “users” doc exists for this email; return its UID. */
async function resolveUserByEmail(
  db: ReturnType<typeof getFirestore>,
  email: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const usersCol = collection(db, "users");
  const snap = await getDocs(
    query(usersCol, where("email", "==", normalized))
  );
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  const uid = uuidv4();
  await setDoc(doc(db, "users", uid), {
    uid,
    email: normalized,
    firstName,
    lastName,
    roles: ["serviceProvider"],
    providerLocationIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

export default function ServiceProviderFormDialog({
  open,
  serviceLocationId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const db = getFirestore();
  const isEdit = Boolean(initialData?.id);

  // UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manage-Status modal state + initial values
  const [lifecycleOpen, setLifecycleOpen] = useState(false);
  const [lifecycleInit, setLifecycleInit] = useState<{
    status: "active" | "banned" | "deactivated";
    msg: string;
  }>({ status: "active", msg: "" });

  // Form state
  const [form, setForm] = useState<Partial<ServiceProvider>>({
    id: "",
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    licenseNumber: "",
    licenseClass: "",
    address: { street: "", city: "", postalCode: "" },
    backgroundCheck: { date: new Date(), status: "pending" },
    rating: { average: 0, reviewCount: 0 },
    availability: [],
    blockedTimes: [],
    vehiclesCertifiedFor: [],
    providerLocationIds: [],
  });

  /** 1) On dialog open: seed BOTH the form and lifecycleInit */
  useEffect(() => {
    if (!open) return;
    (async () => {
      if (initialData) {
        // fetch user profile
        const uSnap = await getDoc(doc(db, "users", initialData.userId));
        const u = uSnap.exists() ? (uSnap.data() as any) : {};

        // serviceProvider-scoped arrays
        const bannedArr: string[] =
          u.bannedServiceProviderLocationIds || [];
        const deactArr: string[] =
          u.deactivatedServiceProviderLocationIds || [];

        // extract the saved note
        const nested = u.lifecycleNotes as Record<string, any> | undefined;
        const note =
          nested?.[serviceLocationId] ??
          u[`lifecycleNotes.${serviceLocationId}`] ??
          undefined;

        // derive status
        let status: "active" | "banned" | "deactivated" = "active";
        if (bannedArr.includes(serviceLocationId)) status = "banned";
        else if (deactArr.includes(serviceLocationId))
          status = "deactivated";

        setLifecycleInit({ status, msg: note?.msg ?? "" });
        setForm({ ...initialData });
      } else {
        // add-mode: clear both form & lifecycle
        setForm({
          id: "",
          userId: "",
          firstName: "",
          lastName: "",
          email: "",
          licenseNumber: "",
          licenseClass: "",
          address: { street: "", city: "", postalCode: "" },
          backgroundCheck: { date: new Date(), status: "pending" },
          rating: { average: 0, reviewCount: 0 },
          availability: [],
          blockedTimes: [],
          vehiclesCertifiedFor: [],
          providerLocationIds: [],
        });
        setLifecycleInit({ status: "active", msg: "" });
      }
      setError(null);
    })();
  }, [open, initialData, db, serviceLocationId]);

  const handleFormChange = (patch: Partial<ServiceProvider>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  /**
   * 2) When “Manage Status” is clicked:
   *    – re-fetch saved status & message
   *    – set lifecycleInit
   *    – open UserLifecycleDialog
   */
  const handleOpenLifecycle = async () => {
    if (initialData) {
      const uSnap = await getDoc(doc(db, "users", initialData.userId));
      const u = uSnap.exists() ? (uSnap.data() as any) : {};

      const bannedArr: string[] =
        u.bannedServiceProviderLocationIds || [];
      const deactArr: string[] =
        u.deactivatedServiceProviderLocationIds || [];

      const nested = u.lifecycleNotes as Record<string, any> | undefined;
      const note =
        nested?.[serviceLocationId] ??
        u[`lifecycleNotes.${serviceLocationId}`] ??
        undefined;

      let status: "active" | "banned" | "deactivated" = "active";
      if (bannedArr.includes(serviceLocationId)) status = "banned";
      else if (deactArr.includes(serviceLocationId))
        status = "deactivated";

      setLifecycleInit({ status, msg: note?.msg ?? "" });
    }
    setLifecycleOpen(true);
  };

  /** 3) Create or update ServiceProvider & user doc */
  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!isEdit) {
        // CREATE
        const payload: CreateServiceProviderInput = {
          email: form.email!.trim().toLowerCase(),
          firstName: form.firstName!,
          lastName: form.lastName!,
          providerLocationIds: [serviceLocationId],
          customFields: {
            licenseNumber: form.licenseNumber,
            licenseClass: form.licenseClass,
            address: form.address,
            backgroundCheck: form.backgroundCheck,
            vehiclesCertifiedFor: form.vehiclesCertifiedFor,
            availability: form.availability,
            blockedTimes: form.blockedTimes,
            rating: form.rating,
          },
        };
        const { providerId, uid } = await createServiceProvider(payload);
        const now = new Date();
        onSave({
          ...form,
          id: providerId,
          userId: uid,
          email: payload.email,
          providerLocationIds: [serviceLocationId],
          createdAt: now,
          updatedAt: now,
        } as ServiceProvider);
        onClose();
      } else {
        // EDIT
        const emailOld = (initialData!.email || "").toLowerCase();
        const emailNew = (form.email || "").trim().toLowerCase();
        let targetUid = initialData!.userId;

        if (emailNew !== emailOld) {
          const snap = await getDocs(
            query(
              collection(db, "users"),
              where("email", "==", emailNew)
            )
          );
          if (!snap.empty) {
            targetUid = snap.docs[0].id;
          } else {
            targetUid = uuidv4();
            await setDoc(doc(db, "users", targetUid), {
              uid: targetUid,
              email: emailNew,
              firstName: form.firstName ?? "",
              lastName: form.lastName ?? "",
              roles: ["serviceProvider"],
              providerLocationIds: [serviceLocationId],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        if (!targetUid) throw new Error("Unable to resolve user UID");

        const provider: ServiceProvider = {
          ...(form as ServiceProvider),
          id: initialData!.id,
          userId: targetUid,
          email: emailNew,
          providerLocationIds: Array.from(
            new Set([
              ...(form.providerLocationIds || []),
              serviceLocationId,
            ])
          ),
          updatedAt: serverTimestamp() as any,
        };

        await serviceProviderStore.save(provider);
        onSave(provider);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /** 4) After UserLifecycleDialog completes an action, just close it */
  const handleLifecycleAction = (
    action: "ban" | "deactivate" | "reactivate" | "delete",
    message?: string
  ) => {
    setLifecycleOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
        <DialogTitle>
          {isEdit ? "Edit Service Provider" : "Add Service Provider"}
        </DialogTitle>

        <DialogContent dividers>
          <ServiceProviderForm form={form} onChange={handleFormChange} />
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
          <Button variant="contained" onClick={handleSubmit} disabled={busy}>
            {busy ? (
              <Box display="flex" alignItems="center">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving…
              </Box>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {isEdit && initialData && (
        <UserLifecycleDialog
          open={lifecycleOpen}
          onClose={() => setLifecycleOpen(false)}
          onActionCompleted={handleLifecycleAction}
          role="serviceProvider"
          uid={initialData.userId}
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
