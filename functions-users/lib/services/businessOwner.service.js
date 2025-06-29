"use strict";
// functions-users/src/services/businessOwner.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBusinessOwnerService = void 0;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
async function createBusinessOwnerService(input) {
    const auth = (0, auth_1.getAuth)();
    const db = (0, firestore_1.getFirestore)();
    let userRecord;
    // Check if user already exists
    try {
        userRecord = await auth.getUserByEmail(input.email);
    }
    catch (_a) {
        // Create user if not found
        userRecord = await auth.createUser({
            email: input.email,
            emailVerified: false,
            disabled: false,
        });
    }
    const uid = userRecord.uid;
    // Attach Firestore profile
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
        email: input.email,
        roles: ["business"],
        ownedBusinessIds: input.businessId ? [input.businessId] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }, { merge: true });
    return {
        success: true,
        uid,
    };
}
exports.createBusinessOwnerService = createBusinessOwnerService;
//# sourceMappingURL=businessOwner.service.js.map