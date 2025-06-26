"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocationAdmin = void 0;
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
const user_service_1 = require("./user.service");
const COLLECTION = "serviceLocationAdmins";
async function createLocationAdmin(payload) {
    var _a;
    const uid = await (0, user_service_1.ensureAuthUser)(payload.email);
    await (0, user_service_1.ensureUserProfile)(uid, payload.email, { role: "serviceLocationAdmin" });
    const ref = firebaseAdmin_client_1.db.collection(COLLECTION).doc();
    await ref.set({
        id: ref.id,
        createdAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        userId: uid,
        serviceLocationId: payload.serviceLocationId,
        permissions: (_a = payload.permissions) !== null && _a !== void 0 ? _a : [],
        status: "active",
    });
    await firebaseAdmin_client_1.db
        .collection("users")
        .doc(uid)
        .update({
        adminLocationIds: firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(payload.serviceLocationId),
    });
    return { adminId: ref.id, uid };
}
exports.createLocationAdmin = createLocationAdmin;
//# sourceMappingURL=locationAdmin.service.js.map