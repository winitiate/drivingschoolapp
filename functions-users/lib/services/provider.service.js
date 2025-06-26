"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = void 0;
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
const user_service_1 = require("./user.service");
/** Collection name kept consistent with your front-end store */
const COLLECTION = "serviceProviders";
async function createProvider(payload) {
    var _a, _b, _c;
    // 1️⃣  Ensure Auth user + user profile
    const uid = await (0, user_service_1.ensureAuthUser)(payload.email);
    await (0, user_service_1.ensureUserProfile)(uid, payload.email, {
        role: "serviceProvider",
    });
    // 2️⃣  Write provider doc
    const ref = firebaseAdmin_client_1.db.collection(COLLECTION).doc();
    await ref.set({
        id: ref.id,
        createdAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        userId: uid,
        providerLocationIds: payload.providerLocationIds,
        firstName: (_a = payload.firstName) !== null && _a !== void 0 ? _a : "",
        lastName: (_b = payload.lastName) !== null && _b !== void 0 ? _b : "",
        customFields: (_c = payload.customFields) !== null && _c !== void 0 ? _c : {},
        status: "active",
    });
    // 3️⃣  Append locationIds + role to user profile
    await (0, user_service_1.ensureUserProfile)(uid, payload.email, {
        role: "serviceProvider",
    });
    await firebaseAdmin_client_1.db
        .collection("users")
        .doc(uid)
        .update({
        providerLocationIds: firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(...payload.providerLocationIds),
    });
    return { providerId: ref.id, uid };
}
exports.createProvider = createProvider;
//# sourceMappingURL=provider.service.js.map