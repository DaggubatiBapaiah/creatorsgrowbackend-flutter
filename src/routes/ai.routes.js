"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var ai_controller_1 = require("../controllers/ai.controller");
var auth_middleware_1 = require("../middleware/auth.middleware");
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var router = (0, express_1.Router)();
var controller = new ai_controller_1.AIController();
// 5 requests per 15 minutes, keyed by authenticated user ID.
// Falls back to IP if user is not yet set (belt-and-suspenders; authenticate runs first).
var aiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: function (req) {
        var _a, _b, _c;
        return (_c = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : req.ip) !== null && _c !== void 0 ? _c : 'unknown';
    },
    message: { error: { message: 'Rate limit exceeded. Please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(auth_middleware_1.authenticate);
router.post('/generate-caption', aiRateLimiter, controller.generateCaption);
exports.default = router;
