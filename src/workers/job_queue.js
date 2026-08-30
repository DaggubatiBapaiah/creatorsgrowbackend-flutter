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
exports.ANALYTICS_POST_SYNC = exports.ANALYTICS_ACCOUNT_SYNC = exports.PUBLISH_JOB = exports.boss = void 0;
exports.startJobQueue = startJobQueue;
var env_1 = require("../config/env");
var content_repository_1 = require("../repositories/content.repository");
var social_repository_1 = require("../repositories/social.repository");
var publisher_factory_1 = require("../services/publishing/publisher.factory");
var meta_analytics_1 = require("../services/analytics/meta.analytics");
var analytics_repository_1 = require("../repositories/analytics.repository");
var crypto_1 = require("../utils/crypto");
var db_1 = require("../config/db");
exports.boss = {
    send: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    start: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    work: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); },
    on: function () { }
};
if (process.env.NODE_ENV !== 'test') {
    var PgBoss = require('pg-boss');
    var PgBossClass = PgBoss.PgBoss || PgBoss.default || PgBoss;
    exports.boss = new PgBossClass({
        connectionString: env_1.env.DATABASE_URL,
    });
}
exports.PUBLISH_JOB = 'publish-post';
exports.ANALYTICS_ACCOUNT_SYNC = 'analytics-account-sync';
exports.ANALYTICS_POST_SYNC = 'analytics-post-sync';
function startJobQueue() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.NODE_ENV === 'test')
                        return [2 /*return*/];
                    exports.boss.on('error', function (error) { return console.error('[PgBoss] Error:', error); });
                    return [4 /*yield*/, exports.boss.start()];
                case 1:
                    _a.sent();
                    console.log('[PgBoss] Job queue started');
                    // Schedule analytics syncs
                    return [4 /*yield*/, exports.boss.schedule(exports.ANALYTICS_ACCOUNT_SYNC, '0 * * * *')];
                case 2:
                    // Schedule analytics syncs
                    _a.sent(); // Every hour
                    return [4 /*yield*/, exports.boss.schedule(exports.ANALYTICS_POST_SYNC, '15 * * * *')];
                case 3:
                    _a.sent(); // Every hour at :15
                    // Work on publishing jobs
                    return [4 /*yield*/, exports.boss.work(exports.PUBLISH_JOB, function (job) { return __awaiter(_this, void 0, void 0, function () {
                            var data, contentRepo, socialRepo, post, acquired, account, publisher, result, errorMsg, err_1, message;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        data = job.data;
                                        contentRepo = new content_repository_1.ContentRepository();
                                        socialRepo = new social_repository_1.SocialRepository();
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 15, , 16]);
                                        return [4 /*yield*/, contentRepo.getPostByIdInternal(data.postId)];
                                    case 2:
                                        post = _a.sent();
                                        if (!post) {
                                            console.warn("[PgBoss] Job ".concat(job.id, ": Post ").concat(data.postId, " not found"));
                                            return [2 /*return*/];
                                        }
                                        if (post.status === 'published' || post.external_post_id) {
                                            console.log("[PgBoss] Job ".concat(job.id, ": Post ").concat(data.postId, " already published."));
                                            return [2 /*return*/];
                                        }
                                        if (post.status === 'cancelled' || post.status === 'failed') {
                                            console.log("[PgBoss] Job ".concat(job.id, ": Post ").concat(data.postId, " is cancelled or failed."));
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, contentRepo.transitionToPublishing(post.id)];
                                    case 3:
                                        acquired = _a.sent();
                                        if (!acquired && post.status !== 'publishing') {
                                            console.warn("[PgBoss] Job ".concat(job.id, ": Failed to acquire publishing lock for ").concat(post.id));
                                            return [2 /*return*/]; // Maybe it's being published elsewhere
                                        }
                                        return [4 /*yield*/, socialRepo.findById(post.social_account_id)];
                                    case 4:
                                        account = _a.sent();
                                        if (!!account) return [3 /*break*/, 6];
                                        return [4 /*yield*/, contentRepo.transitionToFailed(post.id, 'Social account not found')];
                                    case 5:
                                        _a.sent();
                                        return [2 /*return*/];
                                    case 6:
                                        publisher = publisher_factory_1.PublisherFactory.getPublisher(account.platform);
                                        return [4 /*yield*/, publisher.publish(post, account)];
                                    case 7:
                                        result = _a.sent();
                                        if (!(result.success && result.externalPostId)) return [3 /*break*/, 9];
                                        return [4 /*yield*/, contentRepo.transitionToPublished(post.id, result.externalPostId)];
                                    case 8:
                                        _a.sent();
                                        return [3 /*break*/, 14];
                                    case 9:
                                        errorMsg = result.error || 'Unknown error';
                                        if (!(errorMsg.includes('disconnected or expired') || errorMsg.includes('OAuthException'))) return [3 /*break*/, 11];
                                        return [4 /*yield*/, contentRepo.transitionToFailed(post.id, errorMsg, true)];
                                    case 10:
                                        _a.sent(); // reconnect required
                                        return [3 /*break*/, 14];
                                    case 11:
                                        if (!(errorMsg.includes('permanent_failure') || errorMsg.includes('requires a video asset'))) return [3 /*break*/, 13];
                                        return [4 /*yield*/, contentRepo.transitionToFailed(post.id, errorMsg, false)];
                                    case 12:
                                        _a.sent(); // permanent failure
                                        return [3 /*break*/, 14];
                                    case 13:
                                        // Retryable error (e.g. network timeout, or "TikTok processing...")
                                        // Do not transition to failed. Just throw so pg-boss retries it later.
                                        console.log("[PgBoss] Job ".concat(job.id, ": Retryable error for post ").concat(post.id, ": ").concat(errorMsg));
                                        throw new Error(errorMsg);
                                    case 14: return [3 /*break*/, 16];
                                    case 15:
                                        err_1 = _a.sent();
                                        message = err_1.message || 'Worker exception';
                                        console.error("[PgBoss] Job ".concat(job.id, " exception:"), message);
                                        throw err_1; // Let pg-boss retry it. We leave status as 'publishing'.
                                    case 16: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    // Work on publishing jobs
                    _a.sent();
                    // Work on analytics account sync
                    return [4 /*yield*/, exports.boss.work(exports.ANALYTICS_ACCOUNT_SYNC, function () { return __awaiter(_this, void 0, void 0, function () {
                            var socialRepo, analyticsRepo, result, accounts, _i, accounts_1, acc, accessToken, insights, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        // Analytics sync code remains unchanged
                                        console.log('[PgBoss] Starting analytics account sync');
                                        socialRepo = new social_repository_1.SocialRepository();
                                        analyticsRepo = new analytics_repository_1.AnalyticsRepository();
                                        return [4 /*yield*/, db_1.pool.query("SELECT * FROM social_accounts WHERE status = 'connected'")];
                                    case 1:
                                        result = _a.sent();
                                        accounts = result.rows;
                                        _i = 0, accounts_1 = accounts;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < accounts_1.length)) return [3 /*break*/, 8];
                                        acc = accounts_1[_i];
                                        if (!(acc.platform === 'instagram')) return [3 /*break*/, 7];
                                        _a.label = 3;
                                    case 3:
                                        _a.trys.push([3, 6, , 7]);
                                        accessToken = (0, crypto_1.decrypt)(acc.access_token_encrypted);
                                        return [4 /*yield*/, meta_analytics_1.metaAnalyticsClient.getAccountInsights(acc.platform_account_id, accessToken)];
                                    case 4:
                                        insights = _a.sent();
                                        return [4 /*yield*/, analyticsRepo.saveAccountSnapshot(acc.id, insights.followersCount, insights.reach24h, insights.impressions24h)];
                                    case 5:
                                        _a.sent();
                                        return [3 /*break*/, 7];
                                    case 6:
                                        e_1 = _a.sent();
                                        console.error("[PgBoss] Failed to sync account ".concat(acc.id, ":"), e_1.message);
                                        return [3 /*break*/, 7];
                                    case 7:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 5:
                    // Work on analytics account sync
                    _a.sent();
                    // Work on analytics post sync
                    return [4 /*yield*/, exports.boss.work(exports.ANALYTICS_POST_SYNC, function () { return __awaiter(_this, void 0, void 0, function () {
                            var analyticsRepo, result, posts, _i, posts_1, post, accessToken, insights, engagementRate, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        // Analytics sync code remains unchanged
                                        console.log('[PgBoss] Starting analytics post sync');
                                        analyticsRepo = new analytics_repository_1.AnalyticsRepository();
                                        return [4 /*yield*/, db_1.pool.query("\n      SELECT p.*, a.access_token_encrypted, a.access_token_iv, a.platform_account_id\n      FROM content_posts p\n      JOIN social_accounts a ON p.social_account_id = a.id\n      WHERE p.status = 'published' \n        AND p.external_post_id IS NOT NULL \n        AND p.updated_at >= NOW() - INTERVAL '30 days'\n        AND a.status = 'connected'\n    ")];
                                    case 1:
                                        result = _a.sent();
                                        posts = result.rows;
                                        _i = 0, posts_1 = posts;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < posts_1.length)) return [3 /*break*/, 8];
                                        post = posts_1[_i];
                                        _a.label = 3;
                                    case 3:
                                        _a.trys.push([3, 6, , 7]);
                                        accessToken = (0, crypto_1.decrypt)(post.access_token_encrypted);
                                        return [4 /*yield*/, meta_analytics_1.metaAnalyticsClient.getPostInsights(post.external_post_id, accessToken)];
                                    case 4:
                                        insights = _a.sent();
                                        engagementRate = 0;
                                        if (insights.reach > 0) {
                                            engagementRate = (insights.likes + insights.comments + insights.saved) / insights.reach;
                                        }
                                        return [4 /*yield*/, analyticsRepo.savePostSnapshot(post.id, insights.likes, insights.comments, insights.reach, insights.impressions, insights.saved, engagementRate)];
                                    case 5:
                                        _a.sent();
                                        return [3 /*break*/, 7];
                                    case 6:
                                        e_2 = _a.sent();
                                        console.error("[PgBoss] Failed to sync post ".concat(post.id, ":"), e_2.message);
                                        return [3 /*break*/, 7];
                                    case 7:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 6:
                    // Work on analytics post sync
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
