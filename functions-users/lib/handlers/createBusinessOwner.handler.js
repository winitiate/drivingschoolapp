"use strict";
// functions-users/src/handlers/createBusinessOwner.handler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBusinessOwner = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const businessOwner_service_1 = require("../services/businessOwner.service");
exports.createBusinessOwner = (0, https_1.onCall)({ memory: "256MiB", timeoutSeconds: 30 }, async (req) => {
    const data = req.data;
    if (!(data === null || data === void 0 ? void 0 : data.email)) {
        throw new https_2.HttpsError("invalid-argument", "Missing required field: email");
    }
    try {
        return await (0, businessOwner_service_1.createBusinessOwnerService)(data);
    }
    catch (err) {
        console.error("createBusinessOwner error:", err);
        throw new https_2.HttpsError("internal", err.message || "Failed to create business owner");
    }
});
//# sourceMappingURL=createBusinessOwner.handler.js.map