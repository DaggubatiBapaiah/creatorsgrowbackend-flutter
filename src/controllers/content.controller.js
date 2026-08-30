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
exports.ContentController = void 0;
var content_repository_1 = require("../repositories/content.repository");
var entitlement_service_1 = require("../services/billing/entitlement.service");
var social_repository_1 = require("../repositories/social.repository");
var errors_1 = require("../utils/errors");
var publisher_factory_1 = require("../services/publishing/publisher.factory");
var job_queue_1 = require("../workers/job_queue");
var ContentController = /** @class */ (function () {
    function ContentController() {
        var _this = this;
        this.contentRepo = new content_repository_1.ContentRepository();
        this.socialRepo = new social_repository_1.SocialRepository();
        this.createPost = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, entitlementService, withinLimit, e_1, userId, _a, socialAccountId, platform, caption, mediaIds, status_1, scheduledAt, aiGenerated, account, post, publisher, result, updatedPost, delay, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        entitlementService = new entitlement_service_1.EntitlementService();
                        return [4 /*yield*/, entitlementService.checkPostLimit(userId)];
                    case 1:
                        withinLimit = _b.sent();
                        if (!withinLimit) {
                            res.status(403).json({ error: { message: 'Monthly scheduled posts limit reached. Please upgrade your plan.' } });
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _b.sent();
                        return [2 /*return*/, next(e_1)];
                    case 3:
                        _b.trys.push([3, 16, , 17]);
                        userId = req.user.id;
                        _a = req.body, socialAccountId = _a.socialAccountId, platform = _a.platform, caption = _a.caption, mediaIds = _a.mediaIds, status_1 = _a.status, scheduledAt = _a.scheduledAt, aiGenerated = _a.aiGenerated;
                        if (!socialAccountId || !platform) {
                            throw new errors_1.ValidationError('socialAccountId and platform are required.');
                        }
                        return [4 /*yield*/, this.socialRepo.findById(socialAccountId)];
                    case 4:
                        account = _b.sent();
                        if (!account || account.user_id !== userId) {
                            throw new errors_1.ValidationError('Invalid social account.');
                        }
                        if (status_1 === 'scheduled') {
                            if (!scheduledAt)
                                throw new errors_1.ValidationError('scheduledAt is required for scheduled status.');
                            if (new Date(scheduledAt) <= new Date()) {
                                throw new errors_1.ValidationError('Cannot schedule a post in the past.');
                            }
                        }
                        return [4 /*yield*/, this.contentRepo.createPost(userId, socialAccountId, platform, caption, mediaIds || [], status_1 || 'draft', scheduledAt ? new Date(scheduledAt) : null, aiGenerated === true)];
                    case 5:
                        post = _b.sent();
                        if (!(post.status === 'published' || post.status === 'publishing')) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.contentRepo.transitionToPublishing(post.id)];
                    case 6:
                        _b.sent();
                        publisher = publisher_factory_1.PublisherFactory.getPublisher(account.platform);
                        return [4 /*yield*/, publisher.publish(post, account)];
                    case 7:
                        result = _b.sent();
                        if (!(result.success && result.externalPostId)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.contentRepo.transitionToPublished(post.id, result.externalPostId)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, this.contentRepo.transitionToFailed(post.id, result.error || 'Unknown error')];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11: return [4 /*yield*/, this.contentRepo.getPostById(post.id, userId)];
                    case 12:
                        updatedPost = _b.sent();
                        return [2 /*return*/, res.status(201).json({ post: updatedPost })];
                    case 13:
                        if (!(post.status === 'scheduled' && post.scheduled_at)) return [3 /*break*/, 15];
                        delay = post.scheduled_at.getTime() - Date.now();
                        return [4 /*yield*/, job_queue_1.boss.send(job_queue_1.PUBLISH_JOB, { postId: post.id }, { startAfter: Math.max(0, delay / 1000) })];
                    case 14:
                        _b.sent();
                        _b.label = 15;
                    case 15: return [2 /*return*/, res.status(201).json({ post: post })];
                    case 16:
                        error_1 = _b.sent();
                        next(error_1);
                        return [3 /*break*/, 17];
                    case 17: return [2 /*return*/];
                }
            });
        }); };
        this.updatePost = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, _a, caption, mediaIds, status_2, scheduledAt, post, finalScheduledAt, updated, delay, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        userId = req.user.id;
                        id = req.params.id;
                        _a = req.body, caption = _a.caption, mediaIds = _a.mediaIds, status_2 = _a.status, scheduledAt = _a.scheduledAt;
                        return [4 /*yield*/, this.contentRepo.getPostById(id, userId)];
                    case 1:
                        post = _b.sent();
                        if (!post)
                            throw new errors_1.ValidationError('Post not found');
                        if (post.status === 'published' || post.status === 'publishing') {
                            throw new errors_1.ValidationError('Cannot edit a post that is already published or publishing.');
                        }
                        if (status_2 === 'scheduled' || (post.status === 'scheduled' && scheduledAt !== undefined)) {
                            finalScheduledAt = scheduledAt !== undefined ? scheduledAt : post.scheduled_at;
                            if (!finalScheduledAt)
                                throw new errors_1.ValidationError('scheduledAt is required for scheduled status.');
                            if (new Date(finalScheduledAt) <= new Date()) {
                                throw new errors_1.ValidationError('Cannot schedule a post in the past.');
                            }
                        }
                        return [4 /*yield*/, this.contentRepo.updatePost(id, userId, caption !== null && caption !== void 0 ? caption : post.caption, mediaIds !== null && mediaIds !== void 0 ? mediaIds : post.media_ids, status_2 !== null && status_2 !== void 0 ? status_2 : post.status, scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : post.scheduled_at)];
                    case 2:
                        updated = _b.sent();
                        if (!(updated && updated.status === 'scheduled' && updated.scheduled_at)) return [3 /*break*/, 4];
                        delay = updated.scheduled_at.getTime() - Date.now();
                        return [4 /*yield*/, job_queue_1.boss.send(job_queue_1.PUBLISH_JOB, { postId: updated.id }, { startAfter: Math.max(0, delay / 1000) })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, res.status(200).json({ post: updated })];
                    case 5:
                        error_2 = _b.sent();
                        next(error_2);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.getPosts = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, posts, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.contentRepo.getPostsByUser(userId)];
                    case 1:
                        posts = _a.sent();
                        return [2 /*return*/, res.status(200).json({ posts: posts })];
                    case 2:
                        error_3 = _a.sent();
                        next(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.deletePost = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, success, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        id = req.params.id;
                        return [4 /*yield*/, this.contentRepo.deletePost(id, userId)];
                    case 1:
                        success = _a.sent();
                        if (!success)
                            throw new errors_1.ValidationError('Post not found or cannot be deleted.');
                        return [2 /*return*/, res.status(200).json({ status: 'ok' })];
                    case 2:
                        error_4 = _a.sent();
                        next(error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.cancelPost = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, post, updated, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        id = req.params.id;
                        return [4 /*yield*/, this.contentRepo.getPostById(id, userId)];
                    case 1:
                        post = _a.sent();
                        if (!post)
                            throw new errors_1.ValidationError('Post not found');
                        if (post.status !== 'scheduled') {
                            throw new errors_1.ValidationError('Only scheduled posts can be cancelled.');
                        }
                        return [4 /*yield*/, this.contentRepo.updatePost(id, userId, post.caption, post.media_ids, 'cancelled', post.scheduled_at)];
                    case 2:
                        updated = _a.sent();
                        return [2 /*return*/, res.status(200).json({ post: updated })];
                    case 3:
                        error_5 = _a.sent();
                        next(error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    }
    return ContentController;
}());
exports.ContentController = ContentController;
