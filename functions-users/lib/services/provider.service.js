"use strict";
/**
 * provider.service.ts
 * --------------------------------------------------------------------------
 * Domain logic for createServiceProviderCF.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceProvider = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
async function createServiceProvider(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    const email = input.email.trim().toLowerCase();
    /* ─── 1) Ensure Auth user + user-profile ────────────────────────── */
    let uid;
    try {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
    }
    catch (_) {
        /* user does not exist → create */
        const userRecord = await auth.createUser({ email });
        uid = userRecord.uid;
        await db.collection("users").doc(uid).set({
            uid,
            email,
            firstName: (_a = input.firstName) !== null && _a !== void 0 ? _a : "",
            lastName: (_b = input.lastName) !== null && _b !== void 0 ? _b : "",
            roles: ["serviceProvider"],
            ownedBusinessIds: [],
            memberBusinessIds: [],
            ownedLocationIds: [],
            adminLocationIds: [],
            providerLocationIds: input.providerLocationIds,
            clientLocationIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    /* ─── 2) Patch user profile w/ names & new locations ────────────── */
    await db.collection("users").doc(uid).set({
        firstName: (_c = input.firstName) !== null && _c !== void 0 ? _c : "",
        lastName: (_d = input.lastName) !== null && _d !== void 0 ? _d : "",
        roles: ["serviceProvider"],
        providerLocationIds: Array.from(new Set(input.providerLocationIds)),
        updatedAt: new Date(),
    }, { merge: true });
    /* ─── 3) Create / update serviceProvider doc ────────────────────── */
    const providerId = (0, uuid_1.v4)();
    await db.collection("serviceProviders").doc(providerId).set({
        id: providerId,
        userId: uid,
        email,
        firstName: (_e = input.firstName) !== null && _e !== void 0 ? _e : "",
        lastName: (_f = input.lastName) !== null && _f !== void 0 ? _f : "",
        providerLocationIds: input.providerLocationIds,
        customFields: (_g = input.customFields) !== null && _g !== void 0 ? _g : {},
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return { success: true, providerId, userUid: uid };
}
exports.createServiceProvider = createServiceProvider;
//# sourceMappingURL=provider.service.js.map