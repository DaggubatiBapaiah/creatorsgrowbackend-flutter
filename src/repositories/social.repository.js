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
exports.SocialRepository = void 0;
var db_1 = require("../config/db");
var SocialRepository = /** @class */ (function () {
    function SocialRepository() {
    }
    SocialRepository.prototype.getAccountsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM social_accounts WHERE user_id = $1 ORDER BY created_at DESC';
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    SocialRepository.prototype.findAccountByPlatformId = function (platform, platformAccountId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM social_accounts WHERE platform = $1 AND platform_account_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [platform.toUpperCase(), platformAccountId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    SocialRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM social_accounts WHERE id = $1';
                        return [4 /*yield*/, db_1.pool.query(query, [id])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    SocialRepository.prototype.createOrUpdateAccount = function (userId_1, platform_1, platformAccountId_1, username_1, profilePictureUrl_1, accessToken_1, refreshToken_1, expiresAt_1) {
        return __awaiter(this, arguments, void 0, function (userId, platform, platformAccountId, username, profilePictureUrl, accessToken, refreshToken, expiresAt, status, metadata) {
            var query, values, rows;
            if (status === void 0) { status = 'connected'; }
            if (metadata === void 0) { metadata = null; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO social_accounts (\n        id, user_id, platform, platform_account_id, username, \n        profile_picture_url, access_token, refresh_token, expires_at, status, metadata, updated_at\n      )\n      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())\n      ON CONFLICT (platform, platform_account_id)\n      DO UPDATE SET\n        user_id = EXCLUDED.user_id,\n        username = EXCLUDED.username,\n        profile_picture_url = EXCLUDED.profile_picture_url,\n        access_token = EXCLUDED.access_token,\n        refresh_token = EXCLUDED.refresh_token,\n        expires_at = EXCLUDED.expires_at,\n        status = EXCLUDED.status,\n        metadata = EXCLUDED.metadata,\n        updated_at = NOW()\n      RETURNING *\n    ";
                        values = [
                            userId,
                            platform.toUpperCase(),
                            platformAccountId,
                            username,
                            profilePictureUrl,
                            accessToken,
                            refreshToken,
                            expiresAt,
                            status,
                            metadata,
                        ];
                        return [4 /*yield*/, db_1.pool.query(query, values)];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    SocialRepository.prototype.deleteAccount = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'DELETE FROM social_accounts WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    // --- OAuth State Management ---
    SocialRepository.prototype.createOAuthState = function (state, userId, platform, expiresInMs) {
        return __awaiter(this, void 0, void 0, function () {
            var expiresAt, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expiresAt = new Date(Date.now() + expiresInMs);
                        query = 'INSERT INTO oauth_states (state, user_id, platform, expires_at) VALUES ($1, $2, $3, $4)';
                        return [4 /*yield*/, db_1.pool.query(query, [state, userId, platform, expiresAt])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves and deletes the OAuth state atomically to ensure single-use.
     */
    SocialRepository.prototype.consumeOAuthState = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'DELETE FROM oauth_states WHERE state = $1 RETURNING *';
                        return [4 /*yield*/, db_1.pool.query(query, [state])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    return SocialRepository;
}());
exports.SocialRepository = SocialRepository;
