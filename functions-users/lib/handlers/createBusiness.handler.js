"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBusiness = void 0;
/**
 * createBusiness.handler.ts  — HTTPS onRequest (v2)
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const https_1 = require("firebase-functions/v2/https");
const validateRequest_1 = require("../utils/validateRequest");
const business_service_1 = require("../services/business.service");
/* Build an Express app so you can extend later (middleware, etc.) */
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.post("/", async (req, res) => {
    var _a;
    try {
        const p = req.body;
        (0, validateRequest_1.requireString)("name", p.name);
        (0, validateRequest_1.requireString)("ownerEmail", p.ownerEmail);
        const out = await (0, business_service_1.createBusinessDoc)(p);
        res.json(out);
    }
    catch (err) {
        console.error("createBusiness error", err);
        res.status(((_a = err.httpErrorCode) === null || _a === void 0 ? void 0 : _a.status) || 500).json({ error: err.message });
    }
});
/**
 * Export Cloud Function (v2).  First arg = options object, second = handler.
 * Region, cors, memory, timeout, etc. all go inside that options object.
 */
exports.createBusiness = (0, https_1.onRequest)({ region: "us-central1" }, app);
//# sourceMappingURL=createBusiness.handler.js.map