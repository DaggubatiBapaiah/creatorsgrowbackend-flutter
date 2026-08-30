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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokPublisher = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var content_repository_1 = require("../../repositories/content.repository");
var crypto_1 = require("../../utils/crypto");
var db_1 = require("../../config/db");
var env_1 = require("../../config/env");
var TikTokPublisher = /** @class */ (function () {
    function TikTokPublisher() {
    }
    TikTokPublisher.prototype.publish = function (post, account) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, statusRes, statusData, msg, ttStatus, placeholders, query, rows, videoAssets, relativeUrl, cleanUrl, filePath, stat, videoSize, CHUNK_SIZE, totalChunkCount, metadata, publishId, uploadUrl, cInfoRes, cInfoData, msg, privacyOptions, desiredPrivacy, initBody, initRes, initData, errorMsg, contentRepo, fd, i, start, end, sizeToRead, buffer, uploadRes, contentRepo, error_1;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        _h.trys.push([0, 26, , 27]);
                        if (account.platform !== 'TIKTOK') {
                            return [2 /*return*/, { success: false, error: 'TikTokPublisher only supports TIKTOK platform.' }];
                        }
                        if (account.status !== 'connected' || (account.expires_at && new Date() > account.expires_at)) {
                            return [2 /*return*/, { success: false, error: 'Social account is disconnected or expired.' }];
                        }
                        accessToken = (0, crypto_1.decrypt)(account.access_token);
                        if (!post.external_post_id) return [3 /*break*/, 3];
                        if (env_1.env.TIKTOK_OAUTH_MODE === 'mock') {
                            return [2 /*return*/, { success: true, externalPostId: post.external_post_id }];
                        }
                        return [4 /*yield*/, fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json; charset=UTF-8',
                                },
                                body: JSON.stringify({ publish_id: post.external_post_id })
                            })];
                    case 1:
                        statusRes = _h.sent();
                        return [4 /*yield*/, statusRes.json()];
                    case 2:
                        statusData = _h.sent();
                        if (!statusRes.ok || ((_a = statusData.error) === null || _a === void 0 ? void 0 : _a.code) !== 0) {
                            msg = ((_b = statusData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to fetch status';
                            if (statusRes.status === 401 || msg.toLowerCase().includes('token')) {
                                return [2 /*return*/, { success: false, error: "OAuthException: ".concat(msg) }];
                            }
                            throw new Error("TikTok Status API Error: ".concat(msg));
                        }
                        ttStatus = statusData.data.status;
                        if (ttStatus === 'PROCESSING') {
                            throw new Error('TikTok processing...'); // pg-boss will retry
                        }
                        if (ttStatus === 'PUBLISH_COMPLETE') {
                            return [2 /*return*/, { success: true, externalPostId: post.external_post_id }];
                        }
                        if (ttStatus === 'FAILED' || ttStatus === 'PROCESSING_FAILED') {
                            return [2 /*return*/, { success: false, error: "TikTok processing failed: ".concat(statusData.data.fail_reason || 'Unknown reason') }];
                        }
                        throw new Error("Unknown TikTok status: ".concat(ttStatus));
                    case 3:
                        // 2. We need media
                        if (!post.media_ids || post.media_ids.length === 0) {
                            return [2 /*return*/, { success: false, error: 'TikTok requires a video asset.' }];
                        }
                        placeholders = post.media_ids.map(function (_, i) { return "$".concat(i + 1); }).join(',');
                        query = "SELECT url, type FROM media_assets WHERE id IN (".concat(placeholders, ")");
                        return [4 /*yield*/, db_1.pool.query(query, post.media_ids)];
                    case 4:
                        rows = (_h.sent()).rows;
                        videoAssets = rows.filter(function (r) { return r.type === 'video'; });
                        if (videoAssets.length === 0) {
                            return [2 /*return*/, { success: false, error: 'TikTok requires a valid video format.' }];
                        }
                        relativeUrl = videoAssets[0].url;
                        cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
                        filePath = path_1.default.join(process.cwd(), cleanUrl);
                        if (!fs_1.default.existsSync(filePath)) {
                            return [2 /*return*/, { success: false, error: "Media file not found at ".concat(filePath) }];
                        }
                        stat = fs_1.default.statSync(filePath);
                        videoSize = stat.size;
                        CHUNK_SIZE = 10 * 1024 * 1024;
                        totalChunkCount = Math.ceil(videoSize / CHUNK_SIZE);
                        metadata = post.metadata || {};
                        publishId = metadata.tiktok_publish_id;
                        uploadUrl = metadata.tiktok_upload_url;
                        if (!(!publishId || !uploadUrl)) return [3 /*break*/, 14];
                        if (!(env_1.env.TIKTOK_OAUTH_MODE !== 'mock')) return [3 /*break*/, 7];
                        return [4 /*yield*/, fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json; charset=UTF-8'
                                }
                            })];
                    case 5:
                        cInfoRes = _h.sent();
                        return [4 /*yield*/, cInfoRes.json()];
                    case 6:
                        cInfoData = _h.sent();
                        if (!cInfoRes.ok || ((_c = cInfoData.error) === null || _c === void 0 ? void 0 : _c.code) !== 0) {
                            msg = ((_d = cInfoData.error) === null || _d === void 0 ? void 0 : _d.message) || 'Unknown Creator Info error';
                            if (cInfoRes.status === 401 || msg.toLowerCase().includes('token')) {
                                return [2 /*return*/, { success: false, error: "OAuthException: ".concat(msg) }];
                            }
                            return [2 /*return*/, { success: false, error: "Creator Info API Error: ".concat(msg) }];
                        }
                        privacyOptions = cInfoData.data.privacy_level_options || [];
                        desiredPrivacy = metadata.privacy_level || 'SELF_ONLY';
                        if (!privacyOptions.includes(desiredPrivacy)) {
                            // Fallback to SELF_ONLY if available, otherwise fail
                            if (privacyOptions.includes('SELF_ONLY')) {
                                metadata.privacy_level = 'SELF_ONLY';
                            }
                            else {
                                return [2 /*return*/, { success: false, error: "Requested privacy level unsupported by this TikTok account. Allowed: ".concat(privacyOptions.join(',')) }];
                            }
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        metadata.privacy_level = 'SELF_ONLY';
                        _h.label = 8;
                    case 8:
                        if (!(env_1.env.TIKTOK_OAUTH_MODE === 'mock')) return [3 /*break*/, 9];
                        publishId = "mock_tt_post_".concat(Date.now());
                        uploadUrl = 'mock_upload_url';
                        return [3 /*break*/, 12];
                    case 9:
                        initBody = {
                            post_info: {
                                title: post.caption || '',
                                privacy_level: metadata.privacy_level,
                                disable_duet: false,
                                disable_comment: false,
                                disable_stitch: false
                            },
                            source_info: {
                                source: 'FILE_UPLOAD',
                                video_size: videoSize,
                                chunk_size: CHUNK_SIZE,
                                total_chunk_count: totalChunkCount
                            }
                        };
                        return [4 /*yield*/, fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(accessToken),
                                    'Content-Type': 'application/json; charset=UTF-8'
                                },
                                body: JSON.stringify(initBody)
                            })];
                    case 10:
                        initRes = _h.sent();
                        return [4 /*yield*/, initRes.json()];
                    case 11:
                        initData = _h.sent();
                        if (!initRes.ok || ((_e = initData.error) === null || _e === void 0 ? void 0 : _e.code) !== 0) {
                            errorMsg = ((_f = initData.error) === null || _f === void 0 ? void 0 : _f.message) || ((_g = initData.error) === null || _g === void 0 ? void 0 : _g.description) || 'Unknown Init error';
                            if (initRes.status === 401 || errorMsg.toLowerCase().includes('token')) {
                                return [2 /*return*/, { success: false, error: "OAuthException: ".concat(errorMsg) }];
                            }
                            return [2 /*return*/, { success: false, error: "TikTok API Init Error: ".concat(errorMsg) }];
                        }
                        publishId = initData.data.publish_id;
                        uploadUrl = initData.data.upload_url;
                        _h.label = 12;
                    case 12:
                        // Save state to DB to prevent duplicate uploads if worker crashes
                        metadata.tiktok_publish_id = publishId;
                        metadata.tiktok_upload_url = uploadUrl;
                        contentRepo = new content_repository_1.ContentRepository();
                        return [4 /*yield*/, contentRepo.updatePostMetadata(post.id, metadata)];
                    case 13:
                        _h.sent();
                        _h.label = 14;
                    case 14:
                        if (!(env_1.env.TIKTOK_OAUTH_MODE === 'mock')) return [3 /*break*/, 16];
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 15:
                        _h.sent();
                        return [2 /*return*/, { success: true, externalPostId: publishId }];
                    case 16:
                        fd = fs_1.default.openSync(filePath, 'r');
                        _h.label = 17;
                    case 17:
                        _h.trys.push([17, , 24, 25]);
                        i = 0;
                        _h.label = 18;
                    case 18:
                        if (!(i < totalChunkCount)) return [3 /*break*/, 23];
                        start = i * CHUNK_SIZE;
                        end = start + CHUNK_SIZE - 1;
                        if (end >= videoSize) {
                            end = videoSize - 1;
                        }
                        sizeToRead = end - start + 1;
                        buffer = Buffer.alloc(sizeToRead);
                        fs_1.default.readSync(fd, buffer, 0, sizeToRead, start);
                        return [4 /*yield*/, fetch(uploadUrl, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'video/mp4',
                                    'Content-Length': sizeToRead.toString(),
                                    'Content-Range': "bytes ".concat(start, "-").concat(end, "/").concat(videoSize)
                                },
                                body: buffer
                            })];
                    case 19:
                        uploadRes = _h.sent();
                        if (!!uploadRes.ok) return [3 /*break*/, 22];
                        if (!(uploadRes.status === 403 || uploadRes.status === 401)) return [3 /*break*/, 21];
                        contentRepo = new content_repository_1.ContentRepository();
                        return [4 /*yield*/, contentRepo.updatePostMetadata(post.id, {})];
                    case 20:
                        _h.sent();
                        throw new Error('Upload URL expired or rejected. Metadata cleared for next retry.');
                    case 21: throw new Error("Upload failed on chunk ".concat(i + 1, "/").concat(totalChunkCount, ": HTTP ").concat(uploadRes.status));
                    case 22:
                        i++;
                        return [3 /*break*/, 18];
                    case 23: return [3 /*break*/, 25];
                    case 24:
                        fs_1.default.closeSync(fd);
                        return [7 /*endfinally*/];
                    case 25: 
                    // Upload complete. We don't wait for processing; we return the publishId to be saved as external_post_id.
                    // Next time pg-boss retries (or polling happens), it will hit the status fetch block.
                    // We can just throw a processing error immediately to force a quick poll.
                    return [2 /*return*/, { success: true, externalPostId: publishId }];
                    case 26:
                        error_1 = _h.sent();
                        return [2 /*return*/, { success: false, error: error_1.message || 'Unknown TikTok publishing error' }];
                    case 27: return [2 /*return*/];
                }
            });
        });
    };
    return TikTokPublisher;
}());
exports.TikTokPublisher = TikTokPublisher;
