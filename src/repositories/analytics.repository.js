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
exports.AnalyticsRepository = void 0;
var db_1 = require("../config/db");
var AnalyticsRepository = /** @class */ (function () {
    function AnalyticsRepository() {
    }
    AnalyticsRepository.prototype.saveAccountSnapshot = function (socialAccountId, followersCount, reach24h, impressions24h) {
        return __awaiter(this, void 0, void 0, function () {
            var q;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = "\n      INSERT INTO social_account_snapshots (social_account_id, followers_count, reach_24h, impressions_24h)\n      VALUES ($1, $2, $3, $4)\n      ON CONFLICT (social_account_id, collected_at) DO NOTHING\n    ";
                        return [4 /*yield*/, db_1.pool.query(q, [socialAccountId, followersCount, reach24h, impressions24h])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsRepository.prototype.savePostSnapshot = function (postId, likes, comments, reach, impressions, saved, engagementRate) {
        return __awaiter(this, void 0, void 0, function () {
            var q;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = "\n      INSERT INTO content_post_snapshots (post_id, likes, comments, reach, impressions, saved, engagement_rate)\n      VALUES ($1, $2, $3, $4, $5, $6, $7)\n      ON CONFLICT (post_id, collected_at) DO NOTHING\n    ";
                        return [4 /*yield*/, db_1.pool.query(q, [postId, likes, comments, reach, impressions, saved, engagementRate])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getAccountLatestSnapshot = function (socialAccountId) {
        return __awaiter(this, void 0, void 0, function () {
            var q, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = "\n      SELECT * FROM social_account_snapshots\n      WHERE social_account_id = $1\n      ORDER BY collected_at DESC\n      LIMIT 1\n    ";
                        return [4 /*yield*/, db_1.pool.query(q, [socialAccountId])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.rows[0] || null];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getAccountSnapshotHistory = function (socialAccountId_1) {
        return __awaiter(this, arguments, void 0, function (socialAccountId, days) {
            var q, res;
            if (days === void 0) { days = 7; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = "\n      SELECT * FROM social_account_snapshots\n      WHERE social_account_id = $1 AND collected_at >= NOW() - INTERVAL '".concat(days, " days'\n      ORDER BY collected_at ASC\n    ");
                        return [4 /*yield*/, db_1.pool.query(q, [socialAccountId])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.rows];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getAccountIdsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var accountQuery, accountRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accountQuery = "SELECT id FROM social_accounts WHERE user_id = $1";
                        return [4 /*yield*/, db_1.pool.query(accountQuery, [userId])];
                    case 1:
                        accountRes = _a.sent();
                        return [2 /*return*/, accountRes.rows];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getPostStatusCounts = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var contentQuery, contentRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contentQuery = "\n      SELECT status, COUNT(*) as count \n      FROM content_posts \n      WHERE user_id = $1 \n      GROUP BY status\n    ";
                        return [4 /*yield*/, db_1.pool.query(contentQuery, [userId])];
                    case 1:
                        contentRes = _a.sent();
                        return [2 /*return*/, contentRes.rows];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getLatestPostSnapshot = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT * FROM content_post_snapshots \n      WHERE post_id = $1 \n      ORDER BY collected_at DESC \n      LIMIT 1\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [postId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    AnalyticsRepository.prototype.getTopPosts = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      WITH RankedSnapshots AS (\n        SELECT s.*, ROW_NUMBER() OVER (PARTITION BY s.post_id ORDER BY s.collected_at DESC) as rn\n        FROM content_post_snapshots s\n        JOIN content_posts p ON s.post_id = p.id\n        WHERE p.user_id = $1\n      )\n      SELECT r.*, p.caption as title, p.platform\n      FROM RankedSnapshots r\n      JOIN content_posts p ON r.post_id = p.id\n      JOIN social_accounts a ON p.social_account_id = a.id\n      WHERE r.rn = 1\n      ORDER BY r.engagement_rate DESC\n      LIMIT 5;\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    return AnalyticsRepository;
}());
exports.AnalyticsRepository = AnalyticsRepository;
