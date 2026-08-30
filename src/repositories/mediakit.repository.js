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
exports.MediaKitRepository = void 0;
var db_1 = require("../config/db");
var MediaKitRepository = /** @class */ (function () {
    function MediaKitRepository() {
    }
    MediaKitRepository.prototype.getConfigByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "SELECT * FROM media_kit_configs WHERE user_id = $1";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    MediaKitRepository.prototype.createOrUpdateConfig = function (userId_1, customBio_1, contactEmail_1) {
        return __awaiter(this, arguments, void 0, function (userId, customBio, contactEmail, showInstagram, showTiktok, rates) {
            var query, rows;
            if (showInstagram === void 0) { showInstagram = true; }
            if (showTiktok === void 0) { showTiktok = true; }
            if (rates === void 0) { rates = []; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO media_kit_configs (user_id, custom_bio, contact_email, show_instagram, show_tiktok, rates, updated_at)\n      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())\n      ON CONFLICT (user_id) DO UPDATE\n      SET custom_bio = EXCLUDED.custom_bio,\n          contact_email = EXCLUDED.contact_email,\n          show_instagram = EXCLUDED.show_instagram,\n          show_tiktok = EXCLUDED.show_tiktok,\n          rates = EXCLUDED.rates,\n          updated_at = NOW()\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [
                                userId, customBio, contactEmail, showInstagram, showTiktok, JSON.stringify(rates)
                            ])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    MediaKitRepository.prototype.incrementViews = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE media_kit_configs\n      SET views_count = views_count + 1\n      WHERE user_id = $1\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MediaKitRepository.prototype.getPublicKitData = function (identifier) {
        return __awaiter(this, void 0, void 0, function () {
            var userQuery, userRes, user, statsQuery, statsRes, rawPlatforms, platforms, postsQuery, postsRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userQuery = "\n      SELECT u.id as user_id, u.display_name, mk.custom_bio, mk.contact_email, mk.rates, \n             COALESCE(mk.show_instagram, TRUE) as show_instagram, \n             COALESCE(mk.show_tiktok, TRUE) as show_tiktok,\n             COALESCE(mk.views_count, 0) as views_count\n      FROM users u\n      LEFT JOIN media_kit_configs mk ON u.id = mk.user_id\n      WHERE u.id::text = $1 OR LOWER(REPLACE(u.display_name, ' ', '-')) = LOWER($1)\n    ";
                        return [4 /*yield*/, db_1.pool.query(userQuery, [identifier])];
                    case 1:
                        userRes = _a.sent();
                        if (userRes.rows.length === 0)
                            return [2 /*return*/, null];
                        user = userRes.rows[0];
                        // Increment view count since someone accessed the public page
                        return [4 /*yield*/, this.incrementViews(user.user_id)];
                    case 2:
                        // Increment view count since someone accessed the public page
                        _a.sent();
                        user.views_count += 1;
                        statsQuery = "\n      WITH LatestSnapshots AS (\n        SELECT DISTINCT ON (social_account_id) social_account_id, followers_count, reach_24h, impressions_24h, collected_at\n        FROM social_account_snapshots\n        ORDER BY social_account_id, collected_at DESC\n      )\n      SELECT sa.id, sa.platform, sa.username, sa.profile_picture_url,\n             COALESCE(ls.followers_count, 0) as followers,\n             COALESCE(ls.reach_24h, 0) as reach_24h,\n             COALESCE(ls.impressions_24h, 0) as impressions_24h\n      FROM social_accounts sa\n      LEFT JOIN LatestSnapshots ls ON sa.id = ls.social_account_id\n      WHERE sa.user_id = $1 AND sa.status = 'connected'\n    ";
                        return [4 /*yield*/, db_1.pool.query(statsQuery, [user.user_id])];
                    case 3:
                        statsRes = _a.sent();
                        rawPlatforms = statsRes.rows;
                        platforms = rawPlatforms.filter(function (p) {
                            if (p.platform.toLowerCase() === 'instagram' && !user.show_instagram)
                                return false;
                            if (p.platform.toLowerCase() === 'tiktok' && !user.show_tiktok)
                                return false;
                            return true;
                        });
                        postsQuery = "\n      WITH LatestPostSnapshots AS (\n        SELECT DISTINCT ON (post_id) post_id, likes, comments, reach, impressions, saved, engagement_rate, collected_at\n        FROM content_post_snapshots\n        ORDER BY post_id, collected_at DESC\n      )\n      SELECT cp.id, cp.platform, cp.caption, cp.media_ids, cp.published_at,\n             COALESCE(lps.likes, 0) as likes,\n             COALESCE(lps.comments, 0) as comments,\n             COALESCE(lps.reach, 0) as reach,\n             COALESCE(lps.engagement_rate, 0.0000) as engagement_rate\n      FROM content_posts cp\n      INNER JOIN LatestPostSnapshots lps ON cp.id = lps.post_id\n      WHERE cp.user_id = $1 AND cp.status = 'published'\n      ORDER BY lps.engagement_rate DESC\n      LIMIT 3\n    ";
                        return [4 /*yield*/, db_1.pool.query(postsQuery, [user.user_id])];
                    case 4:
                        postsRes = _a.sent();
                        return [2 /*return*/, {
                                user: user,
                                platforms: platforms,
                                topPosts: postsRes.rows
                            }];
                }
            });
        });
    };
    return MediaKitRepository;
}());
exports.MediaKitRepository = MediaKitRepository;
