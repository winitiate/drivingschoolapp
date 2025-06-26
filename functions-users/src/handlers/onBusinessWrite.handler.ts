/**
 * v2 Firestore trigger — onDocumentWritten
 */
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { backfillOwnerFromEmail } from "../services/business.service";

export const onBusinessWrite = onDocumentWritten(
  {
    region: "us-central1",
    document: "businesses/{bizId}",
  },
  async (event) => {
    const after = event.data?.after?.data() as any | undefined;
    if (after?.ownerEmail) {
      await backfillOwnerFromEmail(event.params.bizId, after.ownerEmail);
    }
  }
);
