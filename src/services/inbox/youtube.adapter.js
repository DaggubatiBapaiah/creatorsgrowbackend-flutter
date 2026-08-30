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
exports.YouTubeAdapter = void 0;
var crypto_1 = require("../../utils/crypto");
var YouTubeAdapter = /** @class */ (function () {
    function YouTubeAdapter() {
    }
    YouTubeAdapter.prototype.fetchItems = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock') {
                            return [2 /*return*/, [
                                    {
                                        external_id: 'yt_thread_1',
                                        platform: 'youtube',
                                        item_type: 'comment',
                                        author_name: 'TechGuru India',
                                        content: 'Excellent video overview! Please do a deeper walkthrough soon.',
                                        like_count: 42,
                                        is_read: false,
                                        is_replied: false,
                                        metadata: { isLiked: false, isHidden: false, videoId: 'yt_video_101' },
                                        created_at: new Date(Date.now() - 1800 * 1000),
                                    }
                                ]];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=".concat(account.platform_account_id, "&maxResults=20&access_token=").concat(accessToken))];
                    case 2:
                        res = _b.sent();
                        if (!res.ok)
                            throw new Error('YouTube fetch error');
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _b.sent();
                        return [2 /*return*/, (data.items || []).map(function (item) {
                                var topComment = item.snippet.topLevelComment.snippet;
                                return {
                                    external_id: item.id,
                                    platform: 'youtube',
                                    item_type: 'comment',
                                    author_name: topComment.authorDisplayName,
                                    author_avatar_url: topComment.authorProfileImageUrl,
                                    content: topComment.textDisplay,
                                    like_count: topComment.likeCount || 0,
                                    is_read: false,
                                    is_replied: false,
                                    metadata: { isLiked: false, isHidden: false, videoId: item.snippet.videoId },
                                    created_at: new Date(topComment.publishedAt),
                                };
                            })];
                    case 4:
                        _a = _b.sent();
                        throw { status: 502, message: 'YouTube Data API failure.' };
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    YouTubeAdapter.prototype.postReply = function (account, threadId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, payload, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, 'yt_reply_mock_' + Math.random().toString(36).substring(7)];
                        payload = {
                            snippet: {
                                parentId: threadId,
                                textOriginal: text
                            }
                        };
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/comments?part=snippet&access_token=".concat(accessToken), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw { status: 502, message: 'Failed to post YouTube reply' };
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.id];
                }
            });
        });
    };
    YouTubeAdapter.prototype.toggleLike = function (_account, _commentId, _like) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Official YouTube API does NOT support liking comments on behalf of channel
                throw { status: 405, message: 'Liking comments is not supported by YouTube API.' };
            });
        });
    };
    YouTubeAdapter.prototype.toggleHide = function (account, commentId, hide) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, status, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        status = hide ? 'heldForReview' : 'published';
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/comments/setModerationStatus?id=&id=".concat(commentId, "&moderationStatus=").concat(status, "&access_token=").concat(accessToken), {
                                method: 'POST'
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    YouTubeAdapter.prototype.deleteItem = function (account, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://www.googleapis.com/youtube/v3/comments?id=".concat(commentId, "&access_token=").concat(accessToken), {
                                method: 'DELETE'
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    return YouTubeAdapter;
}());
exports.YouTubeAdapter = YouTubeAdapter;
