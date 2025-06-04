// functions/src/onboarding/onNewBusinessOwnerPending.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();
const auth = getAuth();

interface BusinessOwnerPending {
  email: string;
  firstName: string;
  lastName: string;
  businessIds?: string[];
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export const onNewBusinessOwnerPending = onDocumentCreated(
  "businessOwnersPending/{pendingId}",
  async (event: any) => {
    const snapshot = event.data;
    const pendingData = snapshot.data() as BusinessOwnerPending;
    const pendingId = event.params.pendingId;

    if (!pendingData || !pendingData.email) {
      console.error(
        `onNewBusinessOwnerPending → missing email for pendingId=${pendingId}`
      );
      await snapshot.ref.set(
        {
          error: "Missing required field: email",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const email = pendingData.email.trim().toLowerCase();

    try {
      // 1) Create a new Firebase Auth user (no password)
      const userRecord = await auth.createUser({
        email,
        emailVerified: false,
        disabled: false,
      });
      const newUid = userRecord.uid;
      console.log(
        `Created new Auth user (businessOwner) → uid=${newUid}, email=${email}`
      );

      const now = FieldValue.serverTimestamp();

      // 2) Write /users/{newUid}
      const userProfile = {
        uid: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        roles: ["business"],
        ownedBusinessIds: pendingData.businessIds || [],
        memberBusinessIds: [] as string[],
        ownedLocationIds: [] as string[],
        adminLocationIds: [] as string[],
        providerLocationIds: [] as string[],
        clientLocationIds: [] as string[],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("users").doc(newUid).set(userProfile);
      console.log(`Wrote /users/${newUid} (businessOwner profile)`);

      // 3) Write /businessOwners/{newUid}
      const businessOwnerDoc = {
        id: newUid,
        userId: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        businessIds: pendingData.businessIds || [],
        phoneNumber: pendingData.phoneNumber || "",
        address:
          pendingData.address || { street: "", city: "", postalCode: "" },
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("businessOwners").doc(newUid).set(businessOwnerDoc);
      console.log(`Wrote /businessOwners/${newUid}`);

      // 4) Delete the pending placeholder
      await snapshot.ref.delete();
      console.log(`Deleted /businessOwnersPending/${pendingId}`);
    } catch (error: any) {
      console.error("🔥 Error in onNewBusinessOwnerPending:", error);
      await snapshot.ref.set(
        {
          error: error.message || "Unknown error creating business owner",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
);
