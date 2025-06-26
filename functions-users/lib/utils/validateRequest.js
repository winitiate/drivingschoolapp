"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireString = void 0;
/**
 * validateRequest.ts
 *
 * Feather-weight runtime validator.  Throw HttpsError('invalid-argument', …)
 * if a required field is missing or of wrong type.
 */
const https_1 = require("firebase-functions/v2/https");
function requireString(field, value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new https_1.HttpsError("invalid-argument", `${field} is required`);
    }
}
exports.requireString = requireString;
//# sourceMappingURL=validateRequest.js.map