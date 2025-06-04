// functions/src/onboarding/onNewClientPending.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();
const auth = getAuth();

interface ClientPending {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  clientLocationIds?: string[];
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export const onNewClientPending = onDocumentCreated(
  "clientsPending/{pendingId}",
  async (event: any) => {
    const snapshot = event.data;
    const pendingData = snapshot.data() as ClientPending;
    const pendingId = event.params.pendingId;

    if (!pendingData || !pendingData.email) {
      console.error(
        `onNewClientPending → missing email for pendingId=${pendingId}`
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
        `Created new Auth user (client) → uid=${newUid}, email=${email}`
      );

      const now = FieldValue.serverTimestamp();

      // 2) Write /users/{newUid}
      const userProfile = {
        uid: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        roles: ["client"],
        ownedBusinessIds: [] as string[],
        memberBusinessIds: [] as string[],
        ownedLocationIds: [] as string[],
        adminLocationIds: [] as string[],
        providerLocationIds: [] as string[],
        clientLocationIds: pendingData.clientLocationIds || [],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("users").doc(newUid).set(userProfile);
      console.log(`Wrote /users/${newUid} (client profile)`);

      // 3) Write /clients/{newUid}
      const clientDoc = {
        id: newUid,
        userId: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        phoneNumber: pendingData.phoneNumber || "",
        address:
          pendingData.address || { street: "", city: "", postalCode: "" },
        clientLocationIds: pendingData.clientLocationIds || [],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("clients").doc(newUid).set(clientDoc);
      console.log(`Wrote /clients/${newUid}`);

      // 4) Delete the pending placeholder
      await snapshot.ref.delete();
      console.log(`Deleted /clientsPending/${pendingId}`);
    } catch (error: any) {
      console.error("🔥 Error in onNewClientPending:", error);
      await snapshot.ref.set(
        {
          error: error.message || "Unknown error creating client",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
);
