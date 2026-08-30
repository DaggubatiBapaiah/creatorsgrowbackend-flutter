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
exports.metaOAuthClient = exports.DevelopmentMockMetaOAuthClient = exports.RealMetaOAuthClient = void 0;
var crypto_1 = __importDefault(require("crypto"));
var env_1 = require("../../config/env");
var RealMetaOAuthClient = /** @class */ (function () {
    function RealMetaOAuthClient() {
    }
    RealMetaOAuthClient.prototype.getAuthUrl = function (state) {
        // We are using Facebook Login for Business to get Instagram Professional accounts.
        // META_APP_ID MUST be the Facebook App ID from Settings > Basic.
        // config_id MUST be the Facebook Login for Business Configuration ID.
        var params = new URLSearchParams({
            client_id: env_1.env.META_APP_ID,
            redirect_uri: env_1.env.META_REDIRECT_URI,
            response_type: 'code',
            config_id: env_1.env.META_CONFIG_ID || '',
            state: state,
        });
        return "https://www.facebook.com/v19.0/dialog/oauth?".concat(params.toString());
    };
    RealMetaOAuthClient.prototype.exchangeCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var fbUrl, fbRes, fbData;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fbUrl = "https://graph.facebook.com/v19.0/oauth/access_token?client_id=".concat(env_1.env.META_APP_ID, "&redirect_uri=").concat(encodeURIComponent(env_1.env.META_REDIRECT_URI), "&client_secret=").concat(env_1.env.META_APP_SECRET, "&code=").concat(code);
                        return [4 /*yield*/, fetch(fbUrl)];
                    case 1:
                        fbRes = _b.sent();
                        return [4 /*yield*/, fbRes.json()];
                    case 2:
                        fbData = _b.sent();
                        if (!fbRes.ok || !fbData.access_token) {
                            throw new Error("Meta Token Exchange Failed: ".concat(((_a = fbData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Invalid authorization code'));
                        }
                        return [2 /*return*/, {
                                accessToken: fbData.access_token,
                                expiresInSeconds: fbData.expires_in,
                            }];
                }
            });
        });
    };
    RealMetaOAuthClient.prototype.getProfile = function (accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var pagesUrl, response, data, pages, pageWithIg, igAccount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pagesUrl = "https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=".concat(accessToken);
                        return [4 /*yield*/, fetch(pagesUrl)];
                    case 1:
                        response = _a.sent();
                        if (!response || !response.ok) {
                            throw new Error("Meta Profile Fetch Failed: HTTP ".concat((response === null || response === void 0 ? void 0 : response.status) || 'Unknown'));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        pages = data.data || [];
                        if (pages.length === 0) {
                            throw new Error('No Facebook Pages found for this user.');
                        }
                        pageWithIg = pages.find(function (p) { return p.instagram_business_account != null; });
                        if (!pageWithIg) {
                            throw new Error('No connected Instagram Professional account found on your Facebook Pages.');
                        }
                        igAccount = pageWithIg.instagram_business_account;
                        return [2 /*return*/, {
                                platformAccountId: igAccount.id,
                                username: igAccount.username || "ig_".concat(igAccount.id),
                                profilePictureUrl: igAccount.profile_picture_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
                                metadata: { facebookPageId: pageWithIg.id },
                            }];
                }
            });
        });
    };
    return RealMetaOAuthClient;
}());
exports.RealMetaOAuthClient = RealMetaOAuthClient;
var DevelopmentMockMetaOAuthClient = /** @class */ (function () {
    function DevelopmentMockMetaOAuthClient() {
    }
    DevelopmentMockMetaOAuthClient.prototype.getAuthUrl = function (state) {
        return "".concat(env_1.env.META_REDIRECT_URI, "?code=mock_code_").concat(state.substring(0, 8), "&state=").concat(state);
    };
    DevelopmentMockMetaOAuthClient.prototype.exchangeCode = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        accessToken: 'mock_meta_access_token_' + crypto_1.default.randomBytes(8).toString('hex'),
                        expiresInSeconds: 5184000,
                    }];
            });
        });
    };
    DevelopmentMockMetaOAuthClient.prototype.getProfile = function (accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        platformAccountId: '1182224441650601',
                        username: 'test_creator_meta',
                        profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
                        metadata: { facebookPageId: 'mock_page_id_123' },
                    }];
            });
        });
    };
    return DevelopmentMockMetaOAuthClient;
}());
exports.DevelopmentMockMetaOAuthClient = DevelopmentMockMetaOAuthClient;
exports.metaOAuthClient = env_1.env.META_OAUTH_MODE === 'real'
    ? new RealMetaOAuthClient()
    : new DevelopmentMockMetaOAuthClient();
