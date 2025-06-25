"use strict";
/**
 * functions-invites/src/handlers/acceptInvite.ts
 *
 * Cloud Function: acceptInvite
 *
 * Marks a one-time invite code as accepted in Firestore,
 * and optionally sets a custom user claim for role.
 *
 * Uses the v2 firebase-functions SDK on Gen-2 (Node 22).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvite = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK exactly once
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.acceptInvite = (0, https_1.onCall)(
/**
 * @param data – incoming payload; expects { inviteCode: string }
 * @param context – invocation context, includes auth if signed in
 */
async (data, context) => {
    var _a;
    // 1) Require auth
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in to accept an invite.");
    }
    // 2) Validate inputs
    const inviteCode = data.inviteCode;
    if (typeof inviteCode !== "string" || inviteCode.trim().length === 0) {
        throw new https_1.HttpsError("invalid-argument", "A valid 'inviteCode' string must be provided.");
    }
    try {
        // 3) Fetch the invite doc
        const ref = admin.firestore().collection("invites").doc(inviteCode);
        const snap = await ref.get();
        if (!snap.exists) {
            throw new https_1.HttpsError("not-found", "Invite code not found.");
        }
        const inviteData = snap.data();
        // 4) Prevent reuse
        if (inviteData.accepted) {
            throw new https_1.HttpsError("failed-precondition", "This invite has already been accepted.");
        }
        // 5) Mark accepted
        await ref.update({
            accepted: true,
            acceptedBy: context.auth.uid,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 6) Apply role claim if provided
        if (inviteData.role) {
            await admin.auth().setCustomUserClaims(context.auth.uid, {
                role: inviteData.role,
            });
        }
        // 7) Return success
        return { success: true };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        console.error("acceptInvite error:", err);
        throw new https_1.HttpsError("internal", "Could not accept invite at this time.");
    }
});
//# sourceMappingURL=acceptInvite.js.map