"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillOwnerFromEmail = exports.createBusinessDoc = void 0;
/**
 * business.service.ts
 *
 * Logic reused by createBusiness.handler and onBusinessWrite trigger.
 */
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
const user_service_1 = require("./user.service");
async function createBusinessDoc(p) {
    const ownerUid = await (0, user_service_1.ensureAuthUser)(p.ownerEmail);
    await (0, user_service_1.ensureUserProfile)(ownerUid, p.ownerEmail, { role: "businessOwner" });
    const ref = firebaseAdmin_client_1.db.collection("businesses").doc();
    await ref.set(Object.assign(Object.assign({ id: ref.id, createdAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(), updatedAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp() }, p), { ownerId: ownerUid, ownerIds: [ownerUid], ownerEmails: [p.ownerEmail] }));
    await firebaseAdmin_client_1.db
        .collection("users")
        .doc(ownerUid)
        .update({
        ownedBusinessIds: firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(ref.id),
    });
    return { businessId: ref.id, ownerUid };
}
exports.createBusinessDoc = createBusinessDoc;
async function backfillOwnerFromEmail(bizId, ownerEmail) {
    const ownerUid = await (0, user_service_1.ensureAuthUser)(ownerEmail);
    await (0, user_service_1.ensureUserProfile)(ownerUid, ownerEmail, {
        role: "businessOwner",
        businessId: bizId,
    });
    await firebaseAdmin_client_1.db
        .collection("businesses")
        .doc(bizId)
        .set({
        ownerId: ownerUid,
        ownerIds: firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(ownerUid),
    }, { merge: true });
}
exports.backfillOwnerFromEmail = backfillOwnerFromEmail;
//# sourceMappingURL=business.service.js.map