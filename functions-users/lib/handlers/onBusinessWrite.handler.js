"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBusinessWrite = void 0;
/**
 * v2 Firestore trigger — onDocumentWritten
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const business_service_1 = require("../services/business.service");
exports.onBusinessWrite = (0, firestore_1.onDocumentWritten)({
    region: "us-central1",
    document: "businesses/{bizId}",
}, async (event) => {
    var _a, _b;
    const after = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (after === null || after === void 0 ? void 0 : after.ownerEmail) {
        await (0, business_service_1.backfillOwnerFromEmail)(event.params.bizId, after.ownerEmail);
    }
});
//# sourceMappingURL=onBusinessWrite.handler.js.map