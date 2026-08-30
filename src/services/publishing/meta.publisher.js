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
exports.MetaPublisher = void 0;
var crypto_1 = require("../../utils/crypto");
var db_1 = require("../../config/db");
var env_1 = require("../../config/env");
var MetaPublisher = /** @class */ (function () {
    function MetaPublisher() {
    }
    MetaPublisher.prototype.publish = function (post, account) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, mediaUrls, isVideo, placeholders, query, rows, igUserId, mediaUrl, createContainerUrl, containerBody, containerRes, containerData, errorType, errorMessage, creationId, publishUrl, publishBody, publishRes, publishData, errorType, errorMessage, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 9, , 10]);
                        if (account.platform !== 'INSTAGRAM') {
                            return [2 /*return*/, { success: false, error: 'MetaPublisher only supports INSTAGRAM platform currently.' }];
                        }
                        if (account.status !== 'connected' || (account.expires_at && new Date() > account.expires_at)) {
                            return [2 /*return*/, { success: false, error: 'Social account is disconnected or expired.' }];
                        }
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        mediaUrls = [];
                        isVideo = false;
                        if (!(post.media_ids && post.media_ids.length > 0)) return [3 /*break*/, 2];
                        placeholders = post.media_ids.map(function (_, i) { return "$".concat(i + 1); }).join(',');
                        query = "SELECT url, type FROM media_assets WHERE id IN (".concat(placeholders, ")");
                        return [4 /*yield*/, db_1.pool.query(query, post.media_ids)];
                    case 1:
                        rows = (_e.sent()).rows;
                        mediaUrls = rows.map(function (r) {
                            var host = env_1.env.META_OAUTH_MODE === 'real' ? 'https://example.com' : 'http://localhost:3000';
                            return "".concat(host).concat(r.url);
                        });
                        if (rows.some(function (r) { return r.type === 'video'; }))
                            isVideo = true;
                        _e.label = 2;
                    case 2:
                        if (!(env_1.env.META_OAUTH_MODE === 'mock')) return [3 /*break*/, 4];
                        console.log("[MOCK PUBLISH] Publishing to IG ".concat(account.platform_account_id, " | Caption: ").concat(post.caption, " | Media: ").concat(mediaUrls.join(',')));
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 3:
                        _e.sent();
                        return [2 /*return*/, { success: true, externalPostId: "mock_ig_post_".concat(Date.now()) }];
                    case 4:
                        igUserId = account.platform_account_id;
                        if (mediaUrls.length === 0) {
                            return [2 /*return*/, { success: false, error: 'Instagram requires at least one image or video.' }];
                        }
                        mediaUrl = mediaUrls[0];
                        createContainerUrl = "https://graph.facebook.com/v19.0/".concat(igUserId, "/media");
                        containerBody = new URLSearchParams();
                        if (isVideo) {
                            containerBody.append('media_type', 'REELS');
                            containerBody.append('video_url', mediaUrl);
                        }
                        else {
                            containerBody.append('image_url', mediaUrl);
                        }
                        if (post.caption) {
                            containerBody.append('caption', post.caption);
                        }
                        containerBody.append('access_token', accessToken);
                        return [4 /*yield*/, fetch(createContainerUrl, { method: 'POST', body: containerBody })];
                    case 5:
                        containerRes = _e.sent();
                        return [4 /*yield*/, containerRes.json()];
                    case 6:
                        containerData = _e.sent();
                        if (!containerRes.ok) {
                            errorType = ((_a = containerData.error) === null || _a === void 0 ? void 0 : _a.type) || '';
                            errorMessage = ((_b = containerData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown Meta API error';
                            if (errorType === 'OAuthException') {
                                return [2 /*return*/, { success: false, error: "OAuthException: ".concat(errorMessage) }];
                            }
                            return [2 /*return*/, { success: false, error: "Meta API Error: ".concat(errorMessage) }];
                        }
                        creationId = containerData.id;
                        publishUrl = "https://graph.facebook.com/v19.0/".concat(igUserId, "/media_publish");
                        publishBody = new URLSearchParams();
                        publishBody.append('creation_id', creationId);
                        publishBody.append('access_token', accessToken);
                        return [4 /*yield*/, fetch(publishUrl, { method: 'POST', body: publishBody })];
                    case 7:
                        publishRes = _e.sent();
                        return [4 /*yield*/, publishRes.json()];
                    case 8:
                        publishData = _e.sent();
                        if (!publishRes.ok) {
                            errorType = ((_c = publishData.error) === null || _c === void 0 ? void 0 : _c.type) || '';
                            errorMessage = ((_d = publishData.error) === null || _d === void 0 ? void 0 : _d.message) || 'Unknown Meta Publish error';
                            if (errorType === 'OAuthException') {
                                return [2 /*return*/, { success: false, error: "OAuthException: ".concat(errorMessage) }];
                            }
                            return [2 /*return*/, { success: false, error: "Meta API Publish Error: ".concat(errorMessage) }];
                        }
                        return [2 /*return*/, { success: true, externalPostId: publishData.id }];
                    case 9:
                        error_1 = _e.sent();
                        return [2 /*return*/, { success: false, error: error_1.message || 'Unknown publishing error' }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return MetaPublisher;
}());
exports.MetaPublisher = MetaPublisher;
