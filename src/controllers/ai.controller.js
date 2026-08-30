"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
var ai_service_1 = require("../services/ai/ai.service");
var entitlement_service_1 = require("../services/billing/entitlement.service");
var zod_1 = require("zod");
var generateSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(3).max(500),
    platform: zod_1.z.enum(['INSTAGRAM', 'TIKTOK']),
    tone: zod_1.z.string().optional()
});
var variationSchema = zod_1.z.object({
    hook: zod_1.z.string(),
    body: zod_1.z.string(),
    hashtags: zod_1.z.array(zod_1.z.string()),
    fullText: zod_1.z.string()
});
var AIController = /** @class */ (function () {
    function AIController() {
        var _this = this;
        this.aiService = new ai_service_1.AICopilotService();
        this.entitlementService = new entitlement_service_1.EntitlementService();
        this.generateCaption = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, withinLimit, validated, variations, validatedOutput, error_1, status_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.entitlementService.checkAiLimit(userId)];
                    case 1:
                        withinLimit = _a.sent();
                        if (!withinLimit) {
                            res.status(403).json({ error: { message: 'AI generation limit reached for this month. Please upgrade your plan.' } });
                            return [2 /*return*/];
                        }
                        validated = generateSchema.parse(req.body);
                        return [4 /*yield*/, this.aiService.generateVariations(validated.prompt, validated.platform, validated.tone)];
                    case 2:
                        variations = _a.sent();
                        validatedOutput = zod_1.z.array(variationSchema).parse(variations);
                        res.json({ data: { variations: validatedOutput } });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            res.status(400).json({ error: { message: 'Invalid prompt parameters or malformed upstream response', details: error_1.errors } });
                            return [2 /*return*/];
                        }
                        status_1 = error_1.status || 500;
                        message = error_1.message || 'AI generation failed';
                        res.status(status_1).json({ error: { message: message } });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    }
    return AIController;
}());
exports.AIController = AIController;
