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
exports.XAdapter = void 0;
var crypto_1 = require("../../utils/crypto");
var XAdapter = /** @class */ (function () {
    function XAdapter() {
    }
    XAdapter.prototype.fetchItems = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock') {
                            return [2 /*return*/, [
                                    {
                                        external_id: 'x_mention_1',
                                        platform: 'x',
                                        item_type: 'mention',
                                        author_name: 'amit_p',
                                        content: 'Hey @creator, check this out! Loved your last thread on monetization.',
                                        like_count: 8,
                                        is_read: false,
                                        is_replied: false,
                                        metadata: { isLiked: false, isHidden: false },
                                        created_at: new Date(Date.now() - 400 * 1000),
                                    }
                                ]];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("https://api.twitter.com/2/users/".concat(account.platform_account_id, "/mentions?tweet.fields=created_at,public_metrics&expansions=author_id"), {
                                headers: { 'Authorization': "Bearer ".concat(accessToken) }
                            })];
                    case 2:
                        res = _b.sent();
                        if (!res.ok)
                            throw new Error('X API fetch error');
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _b.sent();
                        return [2 /*return*/, (data.data || []).map(function (tweet) {
                                var _a;
                                return ({
                                    external_id: tweet.id,
                                    platform: 'x',
                                    item_type: 'mention',
                                    author_name: 'twitter_user', // requires author expansion lookup, simplified for fallback
                                    content: tweet.text,
                                    like_count: ((_a = tweet.public_metrics) === null || _a === void 0 ? void 0 : _a.like_count) || 0,
                                    is_read: false,
                                    is_replied: false,
                                    metadata: { isLiked: false, isHidden: false },
                                    created_at: new Date(tweet.created_at),
                                });
                            })];
                    case 4:
                        _a = _b.sent();
                        throw { status: 502, message: 'X/Twitter API failure.' };
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    XAdapter.prototype.postReply = function (account, tweetId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, payload, res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, 'x_reply_mock_' + Math.random().toString(36).substring(7)];
                        payload = {
                            text: text,
                            reply: {
                                in_reply_to_tweet_id: tweetId
                            }
                        };
                        return [4 /*yield*/, fetch('https://api.twitter.com/2/tweets', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw { status: 502, message: 'Failed to post X reply' };
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.data.id];
                }
            });
        });
    };
    XAdapter.prototype.toggleLike = function (account, tweetId, like) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, url, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        url = "https://api.twitter.com/2/users/".concat(account.platform_account_id, "/likes").concat(like ? '' : '/' + tweetId);
                        return [4 /*yield*/, fetch(url, {
                                method: like ? 'POST' : 'DELETE',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json'
                                },
                                body: like ? JSON.stringify({ tweet_id: tweetId }) : undefined
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    XAdapter.prototype.toggleHide = function (account, tweetId, hide) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://api.twitter.com/2/tweets/".concat(tweetId, "/hidden"), {
                                method: 'PUT',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ hidden: hide })
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    XAdapter.prototype.deleteItem = function (account, tweetId) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (accessToken === 'mock')
                            return [2 /*return*/, true];
                        return [4 /*yield*/, fetch("https://api.twitter.com/2/tweets/".concat(tweetId), {
                                method: 'DELETE',
                                headers: { 'Authorization': "Bearer ".concat(accessToken) }
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res.ok];
                }
            });
        });
    };
    return XAdapter;
}());
exports.XAdapter = XAdapter;
