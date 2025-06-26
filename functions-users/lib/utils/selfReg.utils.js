"use strict";
/**
 * selfReg.utils.ts  (Cloud Functions side)
 * --------------------------------------------------------------------------
 * Throws if self-registration is disabled for the given `role`
 * at any of the specified service-location IDs.
 *
 * Resolution order (per location):
 *   1. serviceLocations/{id}.selfRegister[role]    ← explicit override
 *   2. businesses/{bizId}.selfRegister[role]       ← business default
 *   3. Missing / false → rejection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSelfRegAllowed = void 0;
const firebaseAdmin_client_1 = require("../clients/firebaseAdmin.client");
async function assertSelfRegAllowed(role, locationIds) {
    var _a, _b;
    for (const locationId of locationIds) {
        /* ───────── 1. Load location ───────── */
        const locSnap = await firebaseAdmin_client_1.db.collection("serviceLocations").doc(locationId).get();
        if (!locSnap.exists) {
            throw new Error(`Unknown service location ${locationId}`);
        }
        const loc = locSnap.data();
        const locSetting = (_a = loc.selfRegister) === null || _a === void 0 ? void 0 : _a[role];
        if (locSetting === false) {
            throw new Error(`Self-registration for ${role}s disabled at location “${loc.name || locationId}”.`);
        }
        if (locSetting === true)
            continue; // allowed for this location
        /* ───────── 2. Fallback to business default ───────── */
        const bizSnap = await firebaseAdmin_client_1.db.collection("businesses").doc(loc.businessId).get();
        const biz = bizSnap.exists ? bizSnap.data() : null;
        const bizSetting = (_b = biz === null || biz === void 0 ? void 0 : biz.selfRegister) === null || _b === void 0 ? void 0 : _b[role];
        if (bizSetting !== true) {
            throw new Error(`Self-registration for ${role}s disabled for business “${(biz === null || biz === void 0 ? void 0 : biz.name) || loc.businessId}”.`);
        }
        // else allowed → loop continues to next location
    }
}
exports.assertSelfRegAllowed = assertSelfRegAllowed;
//# sourceMappingURL=selfReg.utils.js.map