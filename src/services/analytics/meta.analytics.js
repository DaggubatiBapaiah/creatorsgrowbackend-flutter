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
exports.metaAnalyticsClient = exports.MockMetaAnalyticsClient = exports.RealMetaAnalyticsClient = void 0;
var env_1 = require("../../config/env");
var RealMetaAnalyticsClient = /** @class */ (function () {
    function RealMetaAnalyticsClient() {
    }
    RealMetaAnalyticsClient.prototype.getAccountInsights = function (platformAccountId, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var profileUrl, profileRes, profileData, insightsUrl, insightsRes, insightsData, reach, impressions, _i, _a, metric;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        profileUrl = "https://graph.facebook.com/v19.0/".concat(platformAccountId, "?fields=followers_count&access_token=").concat(accessToken);
                        return [4 /*yield*/, fetch(profileUrl)];
                    case 1:
                        profileRes = _d.sent();
                        return [4 /*yield*/, profileRes.json()];
                    case 2:
                        profileData = _d.sent();
                        if (!profileRes.ok) {
                            throw new Error("Meta Analytics Profile Fetch Failed: ".concat(((_b = profileData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'));
                        }
                        insightsUrl = "https://graph.facebook.com/v19.0/".concat(platformAccountId, "/insights?metric=reach,impressions&period=day&access_token=").concat(accessToken);
                        return [4 /*yield*/, fetch(insightsUrl)];
                    case 3:
                        insightsRes = _d.sent();
                        return [4 /*yield*/, insightsRes.json()];
                    case 4:
                        insightsData = _d.sent();
                        if (!insightsRes.ok) {
                            throw new Error("Meta Analytics Insights Fetch Failed: ".concat(((_c = insightsData.error) === null || _c === void 0 ? void 0 : _c.message) || 'Unknown error'));
                        }
                        reach = 0;
                        impressions = 0;
                        for (_i = 0, _a = insightsData.data || []; _i < _a.length; _i++) {
                            metric = _a[_i];
                            if (metric.name === 'reach' && metric.values.length > 0) {
                                reach = metric.values[0].value; // Latest day value
                            }
                            if (metric.name === 'impressions' && metric.values.length > 0) {
                                impressions = metric.values[0].value;
                            }
                        }
                        return [2 /*return*/, {
                                followersCount: profileData.followers_count || 0,
                                reach24h: reach,
                                impressions24h: impressions,
                            }];
                }
            });
        });
    };
    RealMetaAnalyticsClient.prototype.getPostInsights = function (externalMediaId, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var mediaUrl, mediaRes, mediaData, insightsUrl, insightsRes, insightsData, reach, impressions, saved, _i, _a, metric;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        mediaUrl = "https://graph.facebook.com/v19.0/".concat(externalMediaId, "?fields=like_count,comments_count&access_token=").concat(accessToken);
                        return [4 /*yield*/, fetch(mediaUrl)];
                    case 1:
                        mediaRes = _c.sent();
                        return [4 /*yield*/, mediaRes.json()];
                    case 2:
                        mediaData = _c.sent();
                        if (!mediaRes.ok) {
                            throw new Error("Meta Analytics Media Fetch Failed: ".concat(((_b = mediaData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'));
                        }
                        insightsUrl = "https://graph.facebook.com/v19.0/".concat(externalMediaId, "/insights?metric=reach,impressions,saved&access_token=").concat(accessToken);
                        return [4 /*yield*/, fetch(insightsUrl)];
                    case 3:
                        insightsRes = _c.sent();
                        return [4 /*yield*/, insightsRes.json()];
                    case 4:
                        insightsData = _c.sent();
                        reach = 0;
                        impressions = 0;
                        saved = 0;
                        if (insightsRes.ok && insightsData.data) {
                            for (_i = 0, _a = insightsData.data; _i < _a.length; _i++) {
                                metric = _a[_i];
                                if (metric.name === 'reach' && metric.values.length > 0)
                                    reach = metric.values[0].value;
                                if (metric.name === 'impressions' && metric.values.length > 0)
                                    impressions = metric.values[0].value;
                                if (metric.name === 'saved' && metric.values.length > 0)
                                    saved = metric.values[0].value;
                            }
                        }
                        return [2 /*return*/, {
                                likes: mediaData.like_count || 0,
                                comments: mediaData.comments_count || 0,
                                reach: reach,
                                impressions: impressions,
                                saved: saved,
                            }];
                }
            });
        });
    };
    return RealMetaAnalyticsClient;
}());
exports.RealMetaAnalyticsClient = RealMetaAnalyticsClient;
var MockMetaAnalyticsClient = /** @class */ (function () {
    function MockMetaAnalyticsClient() {
    }
    MockMetaAnalyticsClient.prototype.getAccountInsights = function (platformAccountId, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("[MOCK] Fetching account insights for ".concat(platformAccountId));
                return [2 /*return*/, {
                        followersCount: Math.floor(Math.random() * 10000) + 1000,
                        reach24h: Math.floor(Math.random() * 5000),
                        impressions24h: Math.floor(Math.random() * 8000),
                    }];
            });
        });
    };
    MockMetaAnalyticsClient.prototype.getPostInsights = function (externalMediaId, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("[MOCK] Fetching post insights for ".concat(externalMediaId));
                return [2 /*return*/, {
                        likes: Math.floor(Math.random() * 500),
                        comments: Math.floor(Math.random() * 50),
                        reach: Math.floor(Math.random() * 1000),
                        impressions: Math.floor(Math.random() * 1500),
                        saved: Math.floor(Math.random() * 20),
                    }];
            });
        });
    };
    return MockMetaAnalyticsClient;
}());
exports.MockMetaAnalyticsClient = MockMetaAnalyticsClient;
exports.metaAnalyticsClient = env_1.env.META_OAUTH_MODE === 'real'
    ? new RealMetaAnalyticsClient()
    : new MockMetaAnalyticsClient();
