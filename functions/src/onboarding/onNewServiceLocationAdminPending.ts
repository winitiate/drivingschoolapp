// functions/src/onboarding/onNewServiceLocationAdminPending.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();
const auth = getAuth();

interface ServiceLocationAdminPending {
  email: string;
  firstName: string;
  lastName: string;
  locationIds?: string[];
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export const onNewServiceLocationAdminPending = onDocumentCreated(
  "serviceLocationAdminsPending/{pendingId}",
  async (event: any) => {
    const snapshot = event.data;
    const pendingData = snapshot.data() as ServiceLocationAdminPending;
    const pendingId = event.params.pendingId;

    if (!pendingData || !pendingData.email) {
      console.error(
        `onNewServiceLocationAdminPending → missing email for pendingId=${pendingId}`
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
        `Created new Auth user (locationAdmin) → uid=${newUid}, email=${email}`
      );

      const now = FieldValue.serverTimestamp();

      // 2) Write /users/{newUid}
      const userProfile = {
        uid: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        roles: ["locationAdmin"],
        ownedBusinessIds: [] as string[],
        memberBusinessIds: [] as string[],
        ownedLocationIds: pendingData.locationIds || [],
        adminLocationIds: pendingData.locationIds || [],
        providerLocationIds: [] as string[],
        clientLocationIds: [] as string[],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("users").doc(newUid).set(userProfile);
      console.log(`Wrote /users/${newUid} (locationAdmin profile)`);

      // 3) Write /serviceLocationAdmins/{newUid}
      const locationAdminDoc = {
        id: newUid,
        userId: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        locationIds: pendingData.locationIds || [],
        phoneNumber: pendingData.phoneNumber || "",
        address:
          pendingData.address || { street: "", city: "", postalCode: "" },
        createdAt: now,
        updatedAt: now,
      };
      await db
        .collection("serviceLocationAdmins")
        .doc(newUid)
        .set(locationAdminDoc);
      console.log(`Wrote /serviceLocationAdmins/${newUid}`);

      // 4) Delete the pending placeholder
      await snapshot.ref.delete();
      console.log(`Deleted /serviceLocationAdminsPending/${pendingId}`);
    } catch (error: any) {
      console.error("🔥 Error in onNewServiceLocationAdminPending:", error);
      await snapshot.ref.set(
        {
          error: error.message || "Unknown error creating location admin",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
);
