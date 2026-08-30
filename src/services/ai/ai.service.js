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
exports.AICopilotService = void 0;
var env_1 = require("../../config/env");
var ai_provider_1 = require("./ai.provider");
var AICopilotService = /** @class */ (function () {
    function AICopilotService() {
        if (env_1.env.AI_PROVIDER === 'gemini') {
            this.provider = new ai_provider_1.GeminiProvider();
        }
        else {
            this.provider = new ai_provider_1.MockAIProvider();
        }
    }
    AICopilotService.prototype.generateVariations = function (prompt_1, platform_1) {
        return __awaiter(this, arguments, void 0, function (prompt, platform, tone) {
            var systemInstruction, appInstruction, error_1;
            if (tone === void 0) { tone = 'engaging'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemInstruction = "You are an expert social media content creator and growth strategist. You specialize in creating highly engaging, viral hooks and captions.";
                        appInstruction = "Create 3 distinct variations of a social media post for ".concat(platform, ". The tone should be ").concat(tone, ". \nEnsure each variation has:\n1. A strong, attention-grabbing 'hook'.\n2. A 'body' that provides value and encourages engagement.\n3. Relevant 'hashtags' (3-5 max).\n4. 'fullText' which combines the hook, body, and hashtags neatly formatted with line breaks.\nReturn exactly 3 variations. Avoid emojis if the tone is 'professional'. Do NOT include the user's prompt directly in the system instructions. Focus solely on fulfilling the request.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.provider.generateVariations(systemInstruction, appInstruction, prompt)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        // Map provider failures
                        if (error_1.status) {
                            throw error_1; // Custom mapped error from provider
                        }
                        throw { status: 500, message: 'AI generation failed due to internal error' };
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AICopilotService;
}());
exports.AICopilotService = AICopilotService;
