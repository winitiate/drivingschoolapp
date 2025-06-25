"use strict";
/**
 * functions-invites/src/index.ts
 *
 * Barrel file for the Invites codebase.
 * Exports each Cloud Function so that firebase-tools
 * can discover and deploy them as individual endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvite = exports.createInvite = void 0;
const createInvite_1 = require("./handlers/createInvite");
Object.defineProperty(exports, "createInvite", { enumerable: true, get: function () { return createInvite_1.createInvite; } });
const acceptInvite_1 = require("./handlers/acceptInvite");
Object.defineProperty(exports, "acceptInvite", { enumerable: true, get: function () { return acceptInvite_1.acceptInvite; } });
//# sourceMappingURL=index.js.map