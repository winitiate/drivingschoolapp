"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserProfile = exports.ensureAuthUser = void 0;
/**
 * user.service.ts
 *
 * Helper functions around the central users/{uid} profile.
 */
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
async function ensureAuthUser(email) {
    try {
        return (await firebaseAdmin_client_1.auth.getUserByEmail(email)).uid;
    }
    catch (_a) {
        return (await firebaseAdmin_client_1.auth.createUser({ email })).uid;
    }
}
exports.ensureAuthUser = ensureAuthUser;
/**
 * ensureUserProfile
 *   • merges role + owned/business/location arrays
 *   • creates the profile if missing
 */
async function ensureUserProfile(uid, email, extra) {
    const ref = firebaseAdmin_client_1.db.collection("users").doc(uid);
    const update = {
        uid,
        email,
        updatedAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
        createdAt: firebaseAdmin_client_1.admin.firestore.FieldValue.serverTimestamp(),
    };
    if (extra.role) {
        update.roles = firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(extra.role);
    }
    if (extra.businessId) {
        update.ownedBusinessIds = firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(extra.businessId);
    }
    if (extra.locationId) {
        update.adminLocationIds = firebaseAdmin_client_1.admin.firestore.FieldValue.arrayUnion(extra.locationId);
    }
    await ref.set(update, { merge: true });
}
exports.ensureUserProfile = ensureUserProfile;
//# sourceMappingURL=user.service.js.map