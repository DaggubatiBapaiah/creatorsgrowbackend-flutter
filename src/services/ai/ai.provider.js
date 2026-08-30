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
exports.GeminiProvider = exports.MockAIProvider = void 0;
var env_1 = require("../../config/env");
var MockAIProvider = /** @class */ (function () {
    function MockAIProvider() {
    }
    MockAIProvider.prototype.generateVariations = function (_systemInstruction, _appInstruction, userPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 200); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, [
                                {
                                    hook: 'Mock Hook: ' + userPrompt.substring(0, 30),
                                    body: 'Mock body text. Development mode only.',
                                    hashtags: ['#mock1', '#mock2'],
                                    fullText: 'Mock Hook\n\nMock body text. Development mode only.\n\n#mock1 #mock2'
                                }
                            ]];
                }
            });
        });
    };
    return MockAIProvider;
}());
exports.MockAIProvider = MockAIProvider;
var GeminiProvider = /** @class */ (function () {
    function GeminiProvider() {
    }
    GeminiProvider.prototype.generateVariations = function (systemInstruction, appInstruction, userPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            var fullSystemInstruction, requestBody, url, res, controller_1, timeoutId, e_1, data, jsonText, parsed;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!env_1.env.GEMINI_API_KEY) {
                            throw { status: 500, message: 'AI provider is not configured' };
                        }
                        fullSystemInstruction = [
                            systemInstruction,
                            appInstruction,
                            'You MUST return ONLY a valid JSON object matching this exact schema, with no markdown or prose:',
                            '{ "variations": [ { "hook": "string", "body": "string", "hashtags": ["string"], "fullText": "string" } ] }',
                            'Return exactly 3 variations.'
                        ].join('\n\n');
                        requestBody = {
                            system_instruction: {
                                parts: [{ text: fullSystemInstruction }]
                            },
                            contents: [
                                {
                                    role: 'user',
                                    parts: [{ text: userPrompt }]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                response_mime_type: 'application/json',
                            }
                        };
                        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=".concat(env_1.env.GEMINI_API_KEY);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, , 7]);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, GeminiProvider.TIMEOUT_MS);
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, , 4, 5]);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(requestBody),
                                signal: controller_1.signal,
                            })];
                    case 3:
                        res = _e.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        clearTimeout(timeoutId);
                        return [7 /*endfinally*/];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        e_1 = _e.sent();
                        if ((e_1 === null || e_1 === void 0 ? void 0 : e_1.name) === 'AbortError') {
                            throw { status: 503, message: 'AI provider request timed out' };
                        }
                        throw { status: 503, message: 'Upstream AI provider network error' };
                    case 7:
                        if (res.status === 401 || res.status === 403) {
                            throw { status: 500, message: 'Provider authorization error' };
                        }
                        if (res.status === 429) {
                            throw { status: 429, message: 'Provider rate limit exceeded' };
                        }
                        if (!res.ok) {
                            throw { status: 502, message: 'Temporary upstream error from AI provider' };
                        }
                        return [4 /*yield*/, res.json()];
                    case 8:
                        data = _e.sent();
                        if (!data.candidates || data.candidates.length === 0) {
                            throw { status: 502, message: 'Empty generation from AI provider' };
                        }
                        jsonText = (_d = (_c = (_b = (_a = data.candidates[0]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.parts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.text;
                        if (!jsonText) {
                            throw { status: 502, message: 'Upstream format error (empty content)' };
                        }
                        try {
                            parsed = JSON.parse(jsonText);
                            if (!parsed.variations || !Array.isArray(parsed.variations) || parsed.variations.length === 0) {
                                throw new Error('invalid schema');
                            }
                            return [2 /*return*/, parsed.variations];
                        }
                        catch (_f) {
                            throw { status: 502, message: 'Upstream format error (malformed response)' };
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GeminiProvider.TIMEOUT_MS = 20000;
    return GeminiProvider;
}());
exports.GeminiProvider = GeminiProvider;
