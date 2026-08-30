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
exports.SocialController = void 0;
var crypto_1 = __importDefault(require("crypto"));
var social_repository_1 = require("../repositories/social.repository");
var entitlement_service_1 = require("../services/billing/entitlement.service");
var errors_1 = require("../utils/errors");
var crypto_2 = require("../utils/crypto");
var oauth_client_factory_1 = require("../services/oauth/oauth-client.factory");
var SocialController = /** @class */ (function () {
    function SocialController() {
        var _this = this;
        this.socialRepository = new social_repository_1.SocialRepository();
        this.getAccounts = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, accounts, safeAccounts, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.socialRepository.getAccountsByUserId(userId)];
                    case 1:
                        accounts = _a.sent();
                        safeAccounts = accounts.map(function (acc) { return ({
                            id: acc.id,
                            platform: acc.platform.toLowerCase(),
                            accountName: acc.username,
                            platformAccountId: acc.platform_account_id,
                            profileImageUrl: acc.profile_picture_url,
                            status: acc.status,
                        }); });
                        return [2 /*return*/, res.status(200).json({ accounts: safeAccounts })];
                    case 2:
                        error_1 = _a.sent();
                        next(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.disconnectAccount = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, deleted, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        id = req.params.id;
                        return [4 /*yield*/, this.socialRepository.deleteAccount(id, userId)];
                    case 1:
                        deleted = _a.sent();
                        if (!deleted) {
                            throw new errors_1.ValidationError('Account not found or access denied');
                        }
                        return [2 /*return*/, res.status(200).json({ status: 'ok', message: 'Account disconnected successfully.' })];
                    case 2:
                        error_2 = _a.sent();
                        next(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.connect = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, entitlementService, withinLimit, e_1, userId, platform, client, state, authUrl, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        entitlementService = new entitlement_service_1.EntitlementService();
                        return [4 /*yield*/, entitlementService.checkAccountLimit(userId)];
                    case 1:
                        withinLimit = _a.sent();
                        if (!withinLimit) {
                            res.status(403).json({ error: { message: 'Social accounts limit reached for your plan. Please upgrade.' } });
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, next(e_1)];
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        userId = req.user.id;
                        platform = req.params.platform;
                        client = oauth_client_factory_1.OAuthClientFactory.getClient(platform);
                        state = crypto_1.default.randomBytes(32).toString('hex');
                        return [4 /*yield*/, this.socialRepository.createOAuthState(state, userId, platform.toUpperCase(), 10 * 60 * 1000)];
                    case 4:
                        _a.sent();
                        authUrl = client.getAuthUrl(state);
                        return [2 /*return*/, res.status(200).json({ authUrl: authUrl })];
                    case 5:
                        error_3 = _a.sent();
                        next(error_3);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.callback = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var platform, _a, code, state, error, error_description, oauthState, isMetaGroup, userId, client, tokenData, profile, encryptedToken, encryptedRefreshToken, expiresAt, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        platform = req.params.platform;
                        _a = req.query, code = _a.code, state = _a.state, error = _a.error, error_description = _a.error_description;
                        if (error) {
                            return [2 /*return*/, res.status(400).send("<h1>Connection Failed</h1><p>".concat(error_description || 'OAuth connection request was cancelled or denied.', "</p>"))];
                        }
                        if (!code || !state) {
                            return [2 /*return*/, res.status(400).send('<h1>Bad Request</h1><p>Missing authorization code or verification state.</p>')];
                        }
                        return [4 /*yield*/, this.socialRepository.consumeOAuthState(state)];
                    case 1:
                        oauthState = _b.sent();
                        if (!oauthState) {
                            return [2 /*return*/, res.status(400).send('<h1>Security Validation Failed</h1><p>Invalid or already used OAuth state parameter.</p>')];
                        }
                        isMetaGroup = (platform.toUpperCase() === 'META' || platform.toUpperCase() === 'INSTAGRAM' || platform.toUpperCase() === 'FACEBOOK') &&
                            (oauthState.platform === 'META' || oauthState.platform === 'INSTAGRAM' || oauthState.platform === 'FACEBOOK');
                        if (!isMetaGroup && oauthState.platform !== platform.toUpperCase()) {
                            return [2 /*return*/, res.status(400).send('<h1>Security Validation Failed</h1><p>Invalid or already used OAuth state parameter.</p>')];
                        }
                        if (new Date() > oauthState.expires_at) {
                            return [2 /*return*/, res.status(400).send('<h1>Security Validation Failed</h1><p>OAuth state has expired. Please try connecting again.</p>')];
                        }
                        userId = oauthState.user_id;
                        client = oauth_client_factory_1.OAuthClientFactory.getClient(platform);
                        return [4 /*yield*/, client.exchangeCode(code)];
                    case 2:
                        tokenData = _b.sent();
                        return [4 /*yield*/, client.getProfile(tokenData.accessToken)];
                    case 3:
                        profile = _b.sent();
                        encryptedToken = (0, crypto_2.encrypt)(tokenData.accessToken);
                        encryptedRefreshToken = tokenData.refreshToken ? (0, crypto_2.encrypt)(tokenData.refreshToken) : null;
                        expiresAt = null;
                        if (tokenData.expiresInSeconds) {
                            expiresAt = new Date(Date.now() + tokenData.expiresInSeconds * 1000);
                        }
                        return [4 /*yield*/, this.socialRepository.createOrUpdateAccount(userId, oauthState.platform.toUpperCase() === 'META' ? 'INSTAGRAM' : oauthState.platform.toUpperCase(), profile.platformAccountId, profile.username, profile.profilePictureUrl, encryptedToken, encryptedRefreshToken, expiresAt, 'connected', profile.metadata)];
                    case 4:
                        _b.sent();
                        res.setHeader('Content-Type', 'text/html');
                        return [2 /*return*/, res.send("\n        <!DOCTYPE html>\n        <html>\n        <head>\n          <title>Connection Successful</title>\n          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n          <style>\n            body {\n              background-color: #0F172A;\n              color: #F8FAFC;\n              font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n              display: flex;\n              flex-direction: column;\n              align-items: center;\n              justify-content: center;\n              height: 100vh;\n              margin: 0;\n              padding: 24px;\n              text-align: center;\n            }\n            .card {\n              background-color: #1E293B;\n              border-radius: 16px;\n              padding: 32px;\n              max-width: 400px;\n              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n            }\n            h1 {\n              color: #10B981;\n              font-size: 24px;\n              margin-top: 16px;\n              margin-bottom: 8px;\n            }\n            p {\n              color: #94A3B8;\n              font-size: 16px;\n              line-height: 1.5;\n            }\n            .icon {\n              font-size: 64px;\n              color: #10B981;\n            }\n          </style>\n        </head>\n        <body>\n          <div class=\"card\">\n            <div class=\"icon\">\u00E2\u0153\u201C</div>\n            <h1>Connection Successful!</h1>\n            <p>Your social account has been connected successfully.</p>\n            <p>You can now close this browser tab and return to the application.</p>\n          </div>\n        </body>\n        </html>\n      ")];
                    case 5:
                        error_4 = _b.sent();
                        next(error_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
    }
    return SocialController;
}());
exports.SocialController = SocialController;
