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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiktokOAuthClient = exports.DevelopmentMockTikTokOAuthClient = exports.RealTikTokOAuthClient = void 0;
var crypto_1 = __importDefault(require("crypto"));
var env_1 = require("../../config/env");
var RealTikTokOAuthClient = /** @class */ (function () {
    function RealTikTokOAuthClient() {
    }
    RealTikTokOAuthClient.prototype.getAuthUrl = function (state) {
        return "https://www.tiktok.com/v2/auth/authorize/?client_key=".concat(env_1.env.TIKTOK_CLIENT_KEY, "&scope=user.info.basic,video.publish,video.upload&response_type=code&redirect_uri=").concat(encodeURIComponent(env_1.env.TIKTOK_REDIRECT_URI), "&state=").concat(state);
    };
    RealTikTokOAuthClient.prototype.exchangeCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var url, body, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = 'https://open.tiktokapis.com/v2/oauth/token/';
                        body = new URLSearchParams();
                        body.append('client_key', env_1.env.TIKTOK_CLIENT_KEY);
                        body.append('client_secret', env_1.env.TIKTOK_CLIENT_SECRET);
                        body.append('code', code);
                        body.append('grant_type', 'authorization_code');
                        body.append('redirect_uri', env_1.env.TIKTOK_REDIRECT_URI);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'Cache-Control': 'no-cache',
                                },
                                body: body.toString(),
                            })];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (!response.ok) {
                            throw new Error("TikTok Token Exchange Failed: ".concat(data.error_description || 'Unknown error'));
                        }
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                expiresInSeconds: data.expires_in,
                                refreshToken: data.refresh_token,
                            }];
                }
            });
        });
    };
    RealTikTokOAuthClient.prototype.getProfile = function (accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, data, user;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name';
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                }
                            })];
                    case 1:
                        response = _c.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _c.sent();
                        if (!response.ok || ((_a = data.error) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                            throw new Error("TikTok Profile Fetch Failed: ".concat(((_b = data.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'));
                        }
                        user = data.data.user;
                        return [2 /*return*/, {
                                platformAccountId: user.open_id,
                                username: user.display_name,
                                profilePictureUrl: user.avatar_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150',
                                metadata: { union_id: user.union_id },
                            }];
                }
            });
        });
    };
    return RealTikTokOAuthClient;
}());
exports.RealTikTokOAuthClient = RealTikTokOAuthClient;
var DevelopmentMockTikTokOAuthClient = /** @class */ (function () {
    function DevelopmentMockTikTokOAuthClient() {
    }
    DevelopmentMockTikTokOAuthClient.prototype.getAuthUrl = function (state) {
        return "http://localhost:5173/auth/tiktok/callback?code=mock_tiktok_code&state=".concat(state); // Simulate redirect
    };
    DevelopmentMockTikTokOAuthClient.prototype.exchangeCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        accessToken: 'mock_tiktok_access_token_' + crypto_1.default.randomBytes(8).toString('hex'),
                        expiresInSeconds: 86400,
                        refreshToken: 'mock_tiktok_refresh_token',
                    }];
            });
        });
    };
    DevelopmentMockTikTokOAuthClient.prototype.getProfile = function (accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        platformAccountId: 'tiktok_mock_user_123',
                        username: 'test_creator_tiktok',
                        profilePictureUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150',
                    }];
            });
        });
    };
    return DevelopmentMockTikTokOAuthClient;
}());
exports.DevelopmentMockTikTokOAuthClient = DevelopmentMockTikTokOAuthClient;
exports.tiktokOAuthClient = env_1.env.TIKTOK_OAUTH_MODE === 'real'
    ? new RealTikTokOAuthClient()
    : new DevelopmentMockTikTokOAuthClient();
