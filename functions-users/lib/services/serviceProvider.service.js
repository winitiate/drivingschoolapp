"use strict";
/*  functions-users/src/services/serviceProvider.service.ts  */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceProviderService = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
/**
 * createServiceProviderService
 * ------------------------------------------------------------------
 * • find-or-create Firebase Auth user
 * • merge Firestore user profile (roles, location linkage, names, …)
 * • create **or update** the serviceProviders/<id> document
 */
async function createServiceProviderService(input // ← providerId optional for “edit” calls
) {
    var _a, _b, _c, _d, _e, _f;
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    /* ───────── 1)  Auth user (find-or-create) ───────── */
    let user = await auth.getUserByEmail(input.email).catch(() => null);
    if (!user) {
        user = await auth.createUser({ email: input.email });
    }
    const uid = user.uid;
    /* ───────── 2)  Firestore profile merge ──────────── */
    const userRef = db.doc(`users/${uid}`);
    await userRef.set({
        email: input.email,
        firstName: (_a = input.firstName) !== null && _a !== void 0 ? _a : "",
        lastName: (_b = input.lastName) !== null && _b !== void 0 ? _b : "",
        roles: ["serviceProvider"],
        providerLocationIds: input.providerLocationIds,
        updatedAt: new Date(),
        createdAt: new Date(), // will be ignored if already exists
    }, { merge: true });
    /* ───────── 3)  Service-provider doc ─────────────── */
    const providerId = (_c = input.providerId) !== null && _c !== void 0 ? _c : (0, uuid_1.v4)();
    const spRef = db.doc(`serviceProviders/${providerId}`);
    await spRef.set({
        id: providerId,
        userId: uid,
        email: input.email,
        firstName: (_d = input.firstName) !== null && _d !== void 0 ? _d : "",
        lastName: (_e = input.lastName) !== null && _e !== void 0 ? _e : "",
        providerLocationIds: input.providerLocationIds,
        customFields: (_f = input.customFields) !== null && _f !== void 0 ? _f : {},
        updatedAt: new Date(),
        createdAt: new Date(), // same: ignored on merge
    }, { merge: true });
    /* ───────── 4)  Result – always with userUid ─────── */
    const result = {
        success: true,
        providerId,
        userUid: uid, //  <-- front-end relies on this key
    };
    return result;
}
exports.createServiceProviderService = createServiceProviderService;
//# sourceMappingURL=serviceProvider.service.js.map