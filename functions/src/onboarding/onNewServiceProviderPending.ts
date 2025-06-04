// functions/src/onboarding/onNewServiceProviderPending.ts

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const db = getFirestore();
const auth = getAuth();

interface ServiceProviderPending {
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  licenseClass?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  backgroundCheck?: {
    date: any;
    status: string;
  };
  providerLocationIds?: string[];
  createdAt?: FieldValue;
  updatedAt?: FieldValue;
}

export const onNewServiceProviderPending = onDocumentCreated(
  "serviceProvidersPending/{pendingId}",
  async (event: any) => {
    const snapshot = event.data;
    const pendingData = snapshot.data() as ServiceProviderPending;
    const pendingId = event.params.pendingId;

    if (!pendingData || !pendingData.email) {
      console.error(
        `onNewServiceProviderPending → missing email on pendingId=${pendingId}`
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
        `Created new Auth user (serviceProvider) → uid=${newUid}, email=${email}`
      );

      const now = FieldValue.serverTimestamp();

      // 2) Write /users/{newUid}
      const userProfile = {
        uid: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        roles: ["serviceProvider"],
        ownedBusinessIds: [] as string[],
        memberBusinessIds: [] as string[],
        ownedLocationIds: [] as string[],
        adminLocationIds: [] as string[],
        providerLocationIds: pendingData.providerLocationIds || [],
        clientLocationIds: [] as string[],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("users").doc(newUid).set(userProfile);
      console.log(`Wrote /users/${newUid} profile`);

      // 3) Write /serviceProviders/{newUid}
      const serviceProviderDoc = {
        id: newUid,
        userId: newUid,
        email,
        firstName: pendingData.firstName || "",
        lastName: pendingData.lastName || "",
        licenseNumber: pendingData.licenseNumber || "",
        licenseClass: pendingData.licenseClass || "",
        address:
          pendingData.address || { street: "", city: "", postalCode: "" },
        backgroundCheck:
          pendingData.backgroundCheck || {
            date: new Date(),
            status: "pending",
          },
        rating: { average: 0, reviewCount: 0 },
        availability: [] as any[],
        blockedTimes: [] as any[],
        vehiclesCertifiedFor: [] as any[],
        providerLocationIds: pendingData.providerLocationIds || [],
        createdAt: now,
        updatedAt: now,
      };
      await db.collection("serviceProviders").doc(newUid).set(serviceProviderDoc);
      console.log(`Wrote /serviceProviders/${newUid}`);

      // 4) Delete the pending placeholder
      await snapshot.ref.delete();
      console.log(`Deleted /serviceProvidersPending/${pendingId}`);
    } catch (error: any) {
      console.error("🔥 Error in onNewServiceProviderPending:", error);
      await snapshot.ref.set(
        {
          error:
            error.message || "Unknown error creating service provider",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
);
