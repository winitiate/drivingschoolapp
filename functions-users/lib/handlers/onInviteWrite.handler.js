"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInviteWrite = void 0;
/**
 * v2 Firestore trigger — onDocumentCreated stub
 */
const firestore_1 = require("firebase-functions/v2/firestore");
exports.onInviteWrite = (0, firestore_1.onDocumentCreated)({
    region: "us-central1",
    document: "invites/{inviteId}",
}, async (event) => {
    var _a;
    console.log("Invite created:", (_a = event.data) === null || _a === void 0 ? void 0 : _a.data());
    // TODO: email or FCM
});
//# sourceMappingURL=onInviteWrite.handler.js.map