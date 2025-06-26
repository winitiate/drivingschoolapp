"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceProvider = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const https_1 = require("firebase-functions/v2/https");
const validateRequest_1 = require("../utils/validateRequest");
const selfReg_utils_1 = require("../utils/selfReg.utils");
const provider_service_1 = require("../services/provider.service");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.post("/", async (req, res) => {
    var _a;
    try {
        const p = req.body;
        (0, validateRequest_1.requireString)("email", p.email);
        if (!Array.isArray(p.providerLocationIds) ||
            p.providerLocationIds.length === 0) {
            throw new https_1.HttpsError("invalid-argument", "providerLocationIds[] required");
        }
        await (0, selfReg_utils_1.assertSelfRegAllowed)("provider", p.providerLocationIds);
        const out = await (0, provider_service_1.createProvider)(p);
        res.json(out);
    }
    catch (err) {
        console.error("createServiceProvider error", err);
        res.status(((_a = err.httpErrorCode) === null || _a === void 0 ? void 0 : _a.status) || 500).json({ error: err.message });
    }
});
exports.createServiceProvider = (0, https_1.onRequest)({ region: "us-central1" }, app);
//# sourceMappingURL=createServiceProvider.handler.js.map