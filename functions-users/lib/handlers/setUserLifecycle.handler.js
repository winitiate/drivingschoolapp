"use strict";
/**
 * setUserLifecycle.handler.ts   –  HTTPS **v2** callable
 * ------------------------------------------------------------------
 *  • Validates auth
 *  • Delegates to userLifecycleService
 *  • Export name MUST be *setUserLifecycle* so the function is
 *    deployed at  https://…cloudfunctions.net/**setUserLifecycle**
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserLifecycle = void 0;
const https_1 = require("firebase-functions/v2/https");
const userLifecycle_service_1 = require("../services/userLifecycle.service");
exports.setUserLifecycle = (0, https_1.onCall)({ memory: "256MiB", timeoutSeconds: 30 }, async (req) => {
    var _a;
    if (!req.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign-in required.");
    }
    try {
        return await (0, userLifecycle_service_1.userLifecycleService)(req.data, req.auth.uid);
    }
    catch (err) {
        console.error("[setUserLifecycle]", err);
        throw new https_1.HttpsError("internal", (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : "Lifecycle update failed.");
    }
});
//# sourceMappingURL=setUserLifecycle.handler.js.map