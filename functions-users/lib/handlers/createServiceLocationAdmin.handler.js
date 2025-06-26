"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceLocationAdmin = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const https_1 = require("firebase-functions/v2/https");
const validateRequest_1 = require("../utils/validateRequest");
const locationAdmin_service_1 = require("../services/locationAdmin.service");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.post("/", async (req, res) => {
    var _a;
    try {
        const p = req.body;
        (0, validateRequest_1.requireString)("email", p.email);
        (0, validateRequest_1.requireString)("serviceLocationId", p.serviceLocationId);
        const out = await (0, locationAdmin_service_1.createLocationAdmin)(p);
        res.json(out);
    }
    catch (err) {
        console.error("createServiceLocationAdmin error", err);
        res
            .status(((_a = err.httpErrorCode) === null || _a === void 0 ? void 0 : _a.status) || 500)
            .json({ error: err.message });
    }
});
exports.createServiceLocationAdmin = (0, https_1.onRequest)({ region: "us-central1" }, app);
//# sourceMappingURL=createServiceLocationAdmin.handler.js.map