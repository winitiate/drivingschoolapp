/*  src/pages/SuperAdmin/BusinessManagement/BusinessFormDialog.tsx

  BusinessFormDialog

  • Renders a dialog to create or edit a Business.
  • Handles:
      – Form state & validation via react-hook-form.
      – Creating/updating the Business Firestore document.
      – Ensuring an “owner” user exists (CF wrapper or lookup).
  • Integrates UserLifecycleDialog to manage the **businessOwner** lifecycle:
      – “Manage Status” button appears when editing a Business with an ownerId.
      – Opens UserLifecycleDialog(role="businessOwner", uid=ownerId, locationId=businessId).
      – Dialog fetches and pre-selects the saved Ban/Deactivate/Reactivate status & message.
      – onActionCompleted closes the modal and triggers onSaved() so your list refreshes.
*/

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { businessStore } from "../../../data";
import { Business } from "../../../models/Business";
import { db } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  doc,
  arrayUnion,
} from "firebase/firestore";
import BusinessForm from "../../../components/BusinessForm/BusinessForm";
import { createBusinessOwner } from "../../../services";
import UserLifecycleDialog from "../../../components/UserLifecycle/UserLifecycleDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  business?: Business | null;
  onSaved: () => void;
}

/** Recursively strip undefined so Firestore never complains */
function deepCleanObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(deepCleanObject);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCleanObject(v)])
    );
  }
  return obj;
}

export default function BusinessFormDialog({
  open,
  onClose,
  business,
  onSaved,
}: Props) {
  // react-hook-form setup
  const methods = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      status: "active",
      notes: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
    },
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  // State for “Manage Status” modal
  const [lifecycleOpen, setLifecycleOpen] = useState(false);

  // Populate form when dialog opens or business changes
  useEffect(() => {
    reset({
      name: business?.name || "",
      email: business?.email || "",
      phone: business?.phone || "",
      website: business?.website || "",
      status: business?.status || "active",
      notes: business?.notes || "",
      address: {
        street: business?.address?.street || "",
        city: business?.address?.city || "",
        state: business?.address?.state || "",
        zipCode: business?.address?.zipCode || "",
        country: business?.address?.country || "",
      },
      ownerName: business?.ownerName || "",
      ownerEmail: business?.ownerEmail || "",
      ownerPhone: business?.ownerPhone || "",
    });
  }, [business, reset]);

  // When “Manage Status” completes, close modal and refresh parent
  const handleLifecycleAction = () => {
    setLifecycleOpen(false);
    onSaved();
  };

  // Submit handler for create/update
  const onSubmit = async (data: any) => {
    const bizId = business?.id ?? uuidv4();

    // 1️⃣  Look up existing owner user by email
    let ownerId: string | undefined;
    let existing = false;
    if (data.ownerEmail) {
      const q = query(
        collection(db, "users"),
        where("email", "==", data.ownerEmail.trim().toLowerCase())
      );
      const snaps = await getDocs(q);
      if (!snaps.empty) {
        ownerId = snaps.docs[0].id;
        existing = true;
      }
    }

    // 2️⃣  Create owner via CF if missing
    if (!ownerId && data.ownerEmail) {
      ownerId = await createBusinessOwner({
        email: data.ownerEmail,
        name: data.ownerName,
        phone: data.ownerPhone,
        bizId,
      });
    }

    // 3️⃣  Build & save Business doc
    const draft: Business = {
      id: bizId,
      createdAt: business?.createdAt ?? new Date(),
      updatedAt: new Date(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      website: data.website,
      status: data.status,
      notes: data.notes,
      address: data.address,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      ownerPhone: data.ownerPhone,
      ...(ownerId ? { ownerId } : {}),
    };
    await businessStore.save(deepCleanObject(draft) as Business);

    // 4️⃣  If owner existed, ensure role+link
    if (ownerId && existing) {
      const uRef = doc(db, "users", ownerId);
      await updateDoc(uRef, {
        roles: arrayUnion("businessOwner"),
        ownedBusinessIds: arrayUnion(bizId),
        updatedAt: serverTimestamp(),
      });
    }

    onSaved();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {business ? "Edit Business" : "New Business"}
        </DialogTitle>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Grid container spacing={2} mt={1}>
                <BusinessForm control={control} errors={errors} />
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={onClose} type="button">
                Cancel
              </Button>
              {/* Only show Manage Status when editing & we have an owner */}
              {business?.ownerId && (
                <Button
                  color="secondary"
                  onClick={() => setLifecycleOpen(true)}
                >
                  Manage Status
                </Button>
              )}
              <Button variant="contained" type="submit">
                {business ? "Save Changes" : "Create"}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </Dialog>

      {/* Ban/Deactivate modal for businessOwner */}
      {business?.ownerId && (
        <UserLifecycleDialog
          open={lifecycleOpen}
          onClose={() => setLifecycleOpen(false)}
          onActionCompleted={handleLifecycleAction}
          role="businessOwner"
          uid={business.ownerId}
          locationId={business.id}
        />
      )}
    </>
  );
}
