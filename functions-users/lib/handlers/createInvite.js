"use strict";
/**
 * functions-invites/src/handlers/createInvite.ts
 *
 * Cloud Function: createInvite
 *
 * Generates a one-time invite code, saves it in Firestore,
 * and returns it via a Callable onCall trigger.
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
exports.createInvite = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK exactly once
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.createInvite = (0, https_1.onCall)(
/**
 * @param data – incoming payload; expects { email: string; role?: string }
 * @param context – invocation context, includes auth if signed in
 */
async (data, context) => {
    var _a;
    // 1) Require auth
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in to create an invite.");
    }
    // 2) Validate inputs
    const email = data.email;
    if (typeof email !== "string" || email.trim().length === 0) {
        throw new https_1.HttpsError("invalid-argument", "A valid 'email' string must be provided.");
    }
    const role = typeof data.role === "string" && data.role.trim().length > 0
        ? data.role
        : "user";
    try {
        // 3) Generate an 8-character uppercase code
        const inviteCode = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();
        // 4) Persist in Firestore
        await admin
            .firestore()
            .collection("invites")
            .doc(inviteCode)
            .set({
            email,
            role,
            createdBy: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            accepted: false,
        });
        // 5) Return to client
        return { inviteCode };
    }
    catch (error) {
        console.error("createInvite error:", error);
        throw new https_1.HttpsError("internal", "Could not create invite at this time.");
    }
});
//# sourceMappingURL=createInvite.js.map