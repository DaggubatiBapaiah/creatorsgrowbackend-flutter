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
exports.GrowthService = void 0;
var db_1 = require("../../config/db");
var GrowthService = /** @class */ (function () {
    function GrowthService() {
    }
    GrowthService.prototype.calculateGrowthScore = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var insufficientDataResult, accountsRes, accountIds, recentRes, previousRes, recent, previous, score, factors, followerScore, growth, reachScore, postCountRes, postCount, consistencyScore, trend;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        insufficientDataResult = {
                            score: null,
                            trend: 'none',
                            change: 0,
                            factors: [],
                        };
                        return [4 /*yield*/, db_1.pool.query("SELECT id FROM social_accounts WHERE user_id = $1", [userId])];
                    case 1:
                        accountsRes = _a.sent();
                        if (accountsRes.rowCount === 0)
                            return [2 /*return*/, insufficientDataResult];
                        accountIds = accountsRes.rows.map(function (r) { return r.id; });
                        return [4 /*yield*/, db_1.pool.query("\n      SELECT \n        AVG(reach_24h) as avg_reach,\n        MAX(followers_count) as current_followers\n      FROM social_account_snapshots\n      WHERE social_account_id = ANY($1)\n      AND collected_at >= NOW() - INTERVAL '30 days'\n    ", [accountIds])];
                    case 2:
                        recentRes = _a.sent();
                        return [4 /*yield*/, db_1.pool.query("\n      SELECT \n        AVG(reach_24h) as avg_reach,\n        MAX(followers_count) as old_followers\n      FROM social_account_snapshots\n      WHERE social_account_id = ANY($1)\n      AND collected_at >= NOW() - INTERVAL '60 days'\n      AND collected_at < NOW() - INTERVAL '30 days'\n    ", [accountIds])];
                    case 3:
                        previousRes = _a.sent();
                        recent = recentRes.rows[0];
                        previous = previousRes.rows[0];
                        // If we have literally 0 metrics, return insufficient
                        if (!recent.current_followers && !recent.avg_reach) {
                            return [2 /*return*/, insufficientDataResult];
                        }
                        score = 50;
                        factors = [];
                        followerScore = 50;
                        if (recent.current_followers && previous.old_followers) {
                            growth = (recent.current_followers - previous.old_followers) / Math.max(previous.old_followers, 1);
                            if (growth > 0.05)
                                followerScore = 90;
                            else if (growth > 0)
                                followerScore = 70;
                            else if (growth < 0)
                                followerScore = 30;
                        }
                        else if (recent.current_followers > 0) {
                            followerScore = 60; // Has followers but no history
                        }
                        factors.push({ name: 'Follower Growth', score: followerScore, weight: 0.4 });
                        reachScore = 50;
                        if (recent.avg_reach && previous.avg_reach) {
                            if (recent.avg_reach > previous.avg_reach * 1.1)
                                reachScore = 85;
                            else if (recent.avg_reach > previous.avg_reach)
                                reachScore = 65;
                            else if (recent.avg_reach < previous.avg_reach * 0.9)
                                reachScore = 35;
                        }
                        else if (recent.avg_reach > 0) {
                            reachScore = 60;
                        }
                        factors.push({ name: 'Reach Trend', score: reachScore, weight: 0.3 });
                        return [4 /*yield*/, db_1.pool.query("\n      SELECT COUNT(*) as post_count \n      FROM content_posts \n      WHERE user_id = $1 \n      AND status = 'published' \n      AND published_at >= NOW() - INTERVAL '14 days'\n    ", [userId])];
                    case 4:
                        postCountRes = _a.sent();
                        postCount = parseInt(postCountRes.rows[0].post_count, 10);
                        consistencyScore = 50;
                        if (postCount >= 4)
                            consistencyScore = 90; // Approx 2/week
                        else if (postCount >= 2)
                            consistencyScore = 70;
                        else if (postCount === 0)
                            consistencyScore = 20;
                        factors.push({ name: 'Publishing Consistency', score: consistencyScore, weight: 0.3 });
                        // Final Weighted Score
                        score = Math.round(factors.reduce(function (acc, f) { return acc + (f.score * f.weight); }, 0));
                        trend = 'flat';
                        if (score > 70)
                            trend = 'up';
                        if (score < 40)
                            trend = 'down';
                        return [2 /*return*/, {
                                score: score,
                                trend: trend,
                                change: trend === 'up' ? 5 : (trend === 'down' ? -5 : 0),
                                factors: factors,
                            }];
                }
            });
        });
    };
    GrowthService.prototype.calculateBestTimesToPost = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      WITH PostStats AS (\n        SELECT \n          p.platform,\n          EXTRACT(DOW FROM p.published_at) as day_of_week,\n          EXTRACT(HOUR FROM p.published_at) as hour_of_day,\n          COALESCE(s.reach, 0) as reach,\n          COALESCE(s.engagement_rate, 0) as engagement_rate\n        FROM content_posts p\n        LEFT JOIN content_post_snapshots s ON p.id = s.post_id\n        WHERE p.user_id = $1 AND p.status = 'published' AND p.published_at IS NOT NULL\n      )\n      SELECT \n        platform,\n        day_of_week,\n        hour_of_day,\n        COUNT(*) as sample_size,\n        AVG(reach) as avg_reach,\n        AVG(engagement_rate) as avg_engagement\n      FROM PostStats\n      GROUP BY platform, day_of_week, hour_of_day\n      HAVING COUNT(*) >= 2 -- Minimum sample size protection\n      ORDER BY avg_engagement DESC, avg_reach DESC\n      LIMIT 10\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.rows.map(function (r) { return ({
                                platform: r.platform,
                                dayOfWeek: parseInt(r.day_of_week, 10),
                                hour: parseInt(r.hour_of_day, 10),
                                score: parseFloat(r.avg_engagement) * 100 + (parseInt(r.avg_reach, 10) / 1000), // simplistic combined score metric
                                sampleSize: parseInt(r.sample_size, 10),
                            }); })];
                }
            });
        });
    };
    GrowthService.prototype.analyzeContentPerformance = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, res, totalEng, totalReach, totalSamples, formats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      WITH PostData AS (\n        SELECT \n          p.id,\n          p.media_ids,\n          COALESCE(s.reach, 0) as reach,\n          COALESCE(s.engagement_rate, 0) as engagement_rate,\n          COALESCE(s.saved, 0) as saved,\n          (\n            SELECT COUNT(*) FROM media_assets m \n            WHERE m.id = ANY(p.media_ids) AND m.type = 'video'\n          ) as video_count\n        FROM content_posts p\n        LEFT JOIN content_post_snapshots s ON p.id = s.post_id\n        WHERE p.user_id = $1 AND p.status = 'published'\n      ),\n      Categorized AS (\n        SELECT \n          reach, engagement_rate, saved,\n          CASE \n            WHEN video_count > 0 THEN 'video'\n            WHEN array_length(media_ids, 1) > 1 THEN 'carousel'\n            ELSE 'single_image'\n          END as format\n        FROM PostData\n      )\n      SELECT \n        format,\n        COUNT(*) as sample_size,\n        AVG(engagement_rate) as avg_engagement,\n        AVG(reach) as avg_reach,\n        AVG(saved) as avg_saved\n      FROM Categorized\n      GROUP BY format\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        res = _a.sent();
                        totalEng = 0;
                        totalReach = 0;
                        totalSamples = 0;
                        formats = res.rows.map(function (r) {
                            var sample = parseInt(r.sample_size, 10);
                            var eng = parseFloat(r.avg_engagement);
                            var reach = parseFloat(r.avg_reach);
                            totalEng += eng * sample;
                            totalReach += reach * sample;
                            totalSamples += sample;
                            return {
                                format: r.format,
                                averageEngagementRate: eng,
                                averageReach: reach,
                                averageSaves: parseFloat(r.avg_saved),
                                sampleSize: sample
                            };
                        });
                        return [2 /*return*/, {
                                formats: formats,
                                overallAverageEngagement: totalSamples > 0 ? totalEng / totalSamples : 0,
                                overallAverageReach: totalSamples > 0 ? totalReach / totalSamples : 0,
                            }];
                }
            });
        });
    };
    GrowthService.prototype.generateRecommendations = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var analysis, recs, _i, _a, f, bestTimes, best, days, postCountRes, postCount;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.analyzeContentPerformance(userId)];
                    case 1:
                        analysis = _b.sent();
                        recs = [];
                        if (analysis.formats.length === 0)
                            return [2 /*return*/, recs];
                        // 1. Content Format Recommendations
                        for (_i = 0, _a = analysis.formats; _i < _a.length; _i++) {
                            f = _a[_i];
                            if (f.sampleSize >= 2) {
                                if (f.averageEngagementRate > analysis.overallAverageEngagement * 1.15) {
                                    recs.push({
                                        category: 'content_format',
                                        recommendation: "Publish more ".concat(f.format, "s"),
                                        reason: "Your ".concat(f.format, "s generate above-average engagement."),
                                        metric: {
                                            name: 'engagement_rate',
                                            value: f.averageEngagementRate,
                                            baseline: analysis.overallAverageEngagement
                                        },
                                        confidence: Math.min(0.95, 0.5 + (f.sampleSize * 0.05))
                                    });
                                }
                            }
                        }
                        return [4 /*yield*/, this.calculateBestTimesToPost(userId)];
                    case 2:
                        bestTimes = _b.sent();
                        if (bestTimes.length > 0) {
                            best = bestTimes[0];
                            days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            recs.push({
                                category: 'timing',
                                recommendation: "Publish on ".concat(days[best.dayOfWeek], "s at ").concat(best.hour, ":00"),
                                reason: 'Your audience responds strongly to content published in this window.',
                                metric: {
                                    name: 'relative_score',
                                    value: best.score,
                                    baseline: 0
                                },
                                confidence: Math.min(0.9, 0.6 + (best.sampleSize * 0.05))
                            });
                        }
                        return [4 /*yield*/, db_1.pool.query("\n      SELECT COUNT(*) as post_count \n      FROM content_posts \n      WHERE user_id = $1 \n      AND status = 'published' \n      AND published_at >= NOW() - INTERVAL '14 days'\n    ", [userId])];
                    case 3:
                        postCountRes = _b.sent();
                        postCount = parseInt(postCountRes.rows[0].post_count, 10);
                        if (postCount < 2) {
                            recs.push({
                                category: 'consistency',
                                recommendation: 'Increase your publishing frequency',
                                reason: 'Your posting consistency has been very low over the last 14 days, limiting reach.',
                                metric: {
                                    name: 'posts_last_14d',
                                    value: postCount,
                                    baseline: 4
                                },
                                confidence: 0.8
                            });
                        }
                        // Sort by confidence DESC and return top 5
                        return [2 /*return*/, recs.sort(function (a, b) { return b.confidence - a.confidence; }).slice(0, 5)];
                }
            });
        });
    };
    return GrowthService;
}());
exports.GrowthService = GrowthService;
