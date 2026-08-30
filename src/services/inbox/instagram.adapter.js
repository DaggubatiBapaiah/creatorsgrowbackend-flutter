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
exports.InstagramAdapter = void 0;
var crypto_1 = require("../../utils/crypto");
var InstagramAdapter = /** @class */ (function () {
    function InstagramAdapter() {
    }
    InstagramAdapter.prototype.fetchItems = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, igBusinessId, res, data, items, mediaList, _i, mediaList_1, media, comments, _a, comments_1, comment, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        igBusinessId = account.platform_account_id;
                        if (account.status === 'disconnected') {
                            throw { status: 401, message: 'Instagram token expired or disconnected.' };
                        }
                        // Live API fetch:
                        // GET /v19.0/{ig-user-id}/media?fields=comments{id,text,username,timestamp,like_count,replies{id,text,username}}
                        // For test/dev sandbox logic, we simulate incoming real comments if real token isn't present
                        if (accessToken === 'mock') {
                            return [2 /*return*/, [
                                    {
                                        external_id: 'ig_comment_1',
                                        platform: 'instagram',
                                        item_type: 'comment',
                                        author_name: 'rahul_singh',
                                        content: 'Amazing picture! What camera did you use for this shot?',
                                        like_count: 14,
                                        is_read: false,
                                        is_replied: false,
                                        metadata: { isLiked: false, isHidden: false, mediaId: 'ig_media_101' },
                                        created_at: new Date(Date.now() - 3600 * 1000),
                                    },
                                    {
                                        external_id: 'ig_comment_2',
                                        platform: 'instagram',
                                        item_type: 'comment',
                                        author_name: 'priya_k',
                                        content: 'Keep growing! Love the aesthetics of this feed.',
                                        like_count: 5,
                                        is_read: false,
                                        is_replied: true,
                                        metadata: { isLiked: true, isHidden: false, mediaId: 'ig_media_101' },
                                        created_at: new Date(Date.now() - 7200 * 1000),
                                    }
                                ]];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("https://graph.facebook.com/v19.0/".concat(igBusinessId, "/media?fields=comments{id,text,username,timestamp,like_count}&access_token=").concat(accessToken))];
                    case 2:
                        res = _d.sent();
                        if (!res.ok)
                            throw new Error('Failed to fetch Instagram comments');
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _d.sent();
                        items = [];
                        mediaList = data.data || [];
                        for (_i = 0, mediaList_1 = mediaList; _i < mediaList_1.length; _i++) {
                            media = mediaList_1[_i];
                            comments = ((_c = media.comments) === null || _c === void 0 ? void 0 : _c.data) || [];
                            for (_a = 0, comments_1 = comments; _a < comments_1.length; _a++) {
                                comment = comments_1[_a];
                                items.push({
                                    external_id: comment.id,
                                    platform: 'instagram',
                                    item_type: 'comment',
                                    author_name: comment.username || 'anonymous',
                                    content: comment.text,
                                    like_count: comment.like_count || 0,
                                    is_read: false,
                                    is_replied: false,
                                    metadata: { isLiked: false, isHidden: false, mediaId: media.id },
                                    created_at: new Date(comment.timestamp),
                                });
                            }
                        }
                        return [2 /*return*/, items];
                    case 4:
                        _b = _d.sent();
                        throw { status: 502, message: 'Meta Graph API failure.' };
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    InstagramAdapter.prototype.postReply = function (account, commentId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, 'ig_reply_mock_' + Math.random().toString(36).substring(7)];
                        return [4 /*yield*/, fetch("https://graph.facebook.com/v19.0/".concat(commentId, "/replies?message=").concat(encodeURIComponent(text), "&access_token=").concat(accessToken), {
                                method: 'POST'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw { status: 502, message: 'Failed to post Instagram reply' };
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.id];
                }
            });
        });
    };
    InstagramAdapter.prototype.toggleLike = function (account, commentId, like) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://graph.facebook.com/v19.0/".concat(commentId, "/user_likes?access_token=").concat(accessToken), {
                                method: like ? 'POST' : 'DELETE'
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    InstagramAdapter.prototype.toggleHide = function (account, commentId, hide) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://graph.facebook.com/v19.0/".concat(commentId, "?hide=").concat(hide, "&access_token=").concat(accessToken), {
                                method: 'POST'
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    InstagramAdapter.prototype.deleteItem = function (account, commentId) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://graph.facebook.com/v19.0/".concat(commentId, "?access_token=").concat(accessToken), {
                                method: 'DELETE'
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    return InstagramAdapter;
}());
exports.InstagramAdapter = InstagramAdapter;
