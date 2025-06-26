/**
 * v2 Firestore trigger — onDocumentCreated stub
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onInviteWrite = onDocumentCreated(
  {
    region: "us-central1",
    document: "invites/{inviteId}",
  },
  async (event) => {
    console.log("Invite created:", event.data?.data());
    // TODO: email or FCM
  }
);
