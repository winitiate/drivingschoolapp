"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceProvider = void 0;
const https_1 = require("firebase-functions/v2/https");
const serviceProvider_service_1 = require("../services/serviceProvider.service");
exports.createServiceProvider = (0, https_1.onCall)({ memory: "256MiB", timeoutSeconds: 30 }, async (req) => {
    const data = req.data;
    if (!(data === null || data === void 0 ? void 0 : data.email)) {
        throw new https_1.HttpsError("invalid-argument", "Missing required field: email");
    }
    if (!Array.isArray(data.providerLocationIds) || !data.providerLocationIds.length) {
        throw new https_1.HttpsError("invalid-argument", "providerLocationIds must be a non-empty array");
    }
    try {
        return await (0, serviceProvider_service_1.createServiceProviderService)(data);
    }
    catch (err) {
        console.error("createServiceProvider error:", err);
        throw new https_1.HttpsError("internal", (err === null || err === void 0 ? void 0 : err.message) || "Failed to create service provider");
    }
});
//# sourceMappingURL=createServiceProvider.handler.js.map