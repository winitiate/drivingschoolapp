"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
const user_service_1 = require("./user.service");
const COLLECTION = "clients";
async function createClient(payload) {
    var _a, _b, _c;
    const uid = await (0, user_service_1.ensureAuthUser)(payload.email);
    await (0, user_service_1.ensureUserProfile)(uid, payload.email, { role: "client" });
    const ref = firebaseAdmin_client_1.db.collection(COLLECTION).doc();
    await ref.set({
        id: ref.id,
        createdAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        userId: uid,
        clientLocationIds: payload.clientLocationIds,
        firstName: (_a = payload.firstName) !== null && _a !== void 0 ? _a : "",
        lastName: (_b = payload.lastName) !== null && _b !== void 0 ? _b : "",
        customFields: (_c = payload.customFields) !== null && _c !== void 0 ? _c : {},
        status: "active",
    });
    await firebaseAdmin_client_1.db
        .collection("users")
        .doc(uid)
        .update({
        clientLocationIds: firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(...payload.clientLocationIds),
    });
    return { clientId: ref.id, uid };
}
exports.createClient = createClient;
//# sourceMappingURL=client.service.js.map