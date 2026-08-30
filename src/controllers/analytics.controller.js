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
exports.AnalyticsController = void 0;
var content_repository_1 = require("../repositories/content.repository");
var analytics_repository_1 = require("../repositories/analytics.repository");
var AnalyticsController = /** @class */ (function () {
    function AnalyticsController() {
        var _this = this;
        this.getDashboardStats = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, analyticsRepo, accounts, contentStatusCounts, scheduledCount, publishedCount, draftCount, failedCount, _i, contentStatusCounts_1, row, count, totalFollowers, totalReach24h, totalImpressions24h, historyPoints, _a, accounts_1, acc, snapshot, history_1, dateMap, _b, historyPoints_1, point, dateKey, reach, chartHistory, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 8, , 9]);
                        userId = req.user.id;
                        analyticsRepo = new analytics_repository_1.AnalyticsRepository();
                        return [4 /*yield*/, analyticsRepo.getAccountIdsByUserId(userId)];
                    case 1:
                        accounts = _c.sent();
                        return [4 /*yield*/, analyticsRepo.getPostStatusCounts(userId)];
                    case 2:
                        contentStatusCounts = _c.sent();
                        scheduledCount = 0;
                        publishedCount = 0;
                        draftCount = 0;
                        failedCount = 0;
                        for (_i = 0, contentStatusCounts_1 = contentStatusCounts; _i < contentStatusCounts_1.length; _i++) {
                            row = contentStatusCounts_1[_i];
                            count = parseInt(row.count, 10);
                            if (row.status === 'scheduled')
                                scheduledCount += count;
                            if (row.status === 'published')
                                publishedCount += count;
                            if (row.status === 'draft')
                                draftCount += count;
                            if (row.status === 'failed' || row.status === 'reconnect_required')
                                failedCount += count;
                        }
                        totalFollowers = 0;
                        totalReach24h = 0;
                        totalImpressions24h = 0;
                        historyPoints = [];
                        _a = 0, accounts_1 = accounts;
                        _c.label = 3;
                    case 3:
                        if (!(_a < accounts_1.length)) return [3 /*break*/, 7];
                        acc = accounts_1[_a];
                        return [4 /*yield*/, analyticsRepo.getAccountLatestSnapshot(acc.id)];
                    case 4:
                        snapshot = _c.sent();
                        if (snapshot) {
                            totalFollowers += snapshot.followers_count;
                            totalReach24h += snapshot.reach_24h;
                            totalImpressions24h += snapshot.impressions_24h;
                        }
                        return [4 /*yield*/, analyticsRepo.getAccountSnapshotHistory(acc.id, 90)];
                    case 5:
                        history_1 = _c.sent();
                        historyPoints.push.apply(historyPoints, history_1);
                        _c.label = 6;
                    case 6:
                        _a++;
                        return [3 /*break*/, 3];
                    case 7:
                        dateMap = new Map();
                        for (_b = 0, historyPoints_1 = historyPoints; _b < historyPoints_1.length; _b++) {
                            point = historyPoints_1[_b];
                            dateKey = new Date(point.collected_at).toISOString().split('T')[0];
                            reach = parseInt(point.reach_24h || 0, 10);
                            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + reach);
                        }
                        chartHistory = Array.from(dateMap.entries())
                            .map(function (_a) {
                            var date = _a[0], reach = _a[1];
                            return ({ date: date, reach: reach });
                        })
                            .sort(function (a, b) { return a.date.localeCompare(b.date); });
                        return [2 /*return*/, res.status(200).json({
                                connectedAccounts: accounts.length,
                                scheduledPosts: scheduledCount,
                                publishedPosts: publishedCount,
                                draftPosts: draftCount,
                                failedPosts: failedCount,
                                followersCount: totalFollowers,
                                reach24h: totalReach24h,
                                impressions24h: totalImpressions24h,
                                history: chartHistory,
                            })];
                    case 8:
                        error_1 = _c.sent();
                        next(error_1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        }); };
        this.getPostAnalytics = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, postId, contentRepo, post, analyticsRepo, snapshot, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        postId = req.params.postId;
                        contentRepo = new content_repository_1.ContentRepository();
                        return [4 /*yield*/, contentRepo.getPostById(postId, userId)];
                    case 1:
                        post = _a.sent();
                        if (!post) {
                            return [2 /*return*/, res.status(404).json({ error: 'Post not found' })];
                        }
                        analyticsRepo = new analytics_repository_1.AnalyticsRepository();
                        return [4 /*yield*/, analyticsRepo.getLatestPostSnapshot(postId)];
                    case 2:
                        snapshot = _a.sent();
                        if (!snapshot) {
                            return [2 /*return*/, res.status(200).json({
                                    status: 'unavailable',
                                    message: 'Analytics not synced yet or unavailable for this platform.'
                                })];
                        }
                        return [2 /*return*/, res.status(200).json({ analytics: snapshot })];
                    case 3:
                        error_2 = _a.sent();
                        next(error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.getTopPosts = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, analyticsRepo, topPosts, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        analyticsRepo = new analytics_repository_1.AnalyticsRepository();
                        return [4 /*yield*/, analyticsRepo.getTopPosts(userId)];
                    case 1:
                        topPosts = _a.sent();
                        return [2 /*return*/, res.status(200).json({ topPosts: topPosts })];
                    case 2:
                        error_3 = _a.sent();
                        next(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    }
    return AnalyticsController;
}());
exports.AnalyticsController = AnalyticsController;
