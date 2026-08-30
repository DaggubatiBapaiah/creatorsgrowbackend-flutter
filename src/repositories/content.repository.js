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
exports.ContentRepository = void 0;
var db_1 = require("../config/db");
var ContentRepository = /** @class */ (function () {
    function ContentRepository() {
    }
    ContentRepository.prototype.createPost = function (userId_1, socialAccountId_1, platform_1, caption_1, mediaIds_1, status_1, scheduledAt_1) {
        return __awaiter(this, arguments, void 0, function (userId, socialAccountId, platform, caption, mediaIds, status, scheduledAt, aiGenerated) {
            var query, rows;
            if (aiGenerated === void 0) { aiGenerated = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO content_posts (\n        user_id, social_account_id, platform, caption, media_ids, status, scheduled_at, ai_generated, updated_at\n      )\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId, socialAccountId, platform, caption, mediaIds || [], status, scheduledAt, aiGenerated])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    ContentRepository.prototype.updatePost = function (id, userId, caption, mediaIds, status, scheduledAt) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE content_posts\n      SET caption = $1, media_ids = $2, status = $3, scheduled_at = $4, updated_at = NOW()\n      WHERE id = $5 AND user_id = $6\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [caption, mediaIds || [], status, scheduledAt, id, userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    ContentRepository.prototype.getPostsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "SELECT * FROM content_posts WHERE user_id = $1 ORDER BY created_at DESC";
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    ContentRepository.prototype.getPostById = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "SELECT * FROM content_posts WHERE id = $1 AND user_id = $2";
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    ContentRepository.prototype.deletePost = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "DELETE FROM content_posts WHERE id = $1 AND user_id = $2";
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    ContentRepository.prototype.getPostByIdInternal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "SELECT * FROM content_posts WHERE id = $1";
                        return [4 /*yield*/, db_1.pool.query(query, [id])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    ContentRepository.prototype.getDuePosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT * FROM content_posts \n      WHERE status = 'scheduled' AND scheduled_at <= NOW()\n    ";
                        return [4 /*yield*/, db_1.pool.query(query)];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    ContentRepository.prototype.transitionToScheduled = function (id, scheduledAt) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "UPDATE content_posts SET status = 'scheduled', scheduled_at = $2, updated_at = NOW() WHERE id = $1 AND status IN ('draft', 'failed', 'cancelled', 'reconnect_required')";
                        return [4 /*yield*/, db_1.pool.query(query, [id, scheduledAt])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    ContentRepository.prototype.transitionToPublishing = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "UPDATE content_posts SET status = 'publishing', updated_at = NOW() WHERE id = $1 AND status IN ('scheduled', 'draft', 'failed')";
                        return [4 /*yield*/, db_1.pool.query(query, [id])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    ContentRepository.prototype.transitionToPublished = function (id, externalId) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE content_posts \n      SET status = 'published', external_post_id = $2, published_at = NOW(), metadata = '{}'::jsonb, updated_at = NOW()\n      WHERE id = $1\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [id, externalId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ContentRepository.prototype.transitionToFailed = function (id_1, reason_1) {
        return __awaiter(this, arguments, void 0, function (id, reason, reconnectRequired) {
            var status, query;
            if (reconnectRequired === void 0) { reconnectRequired = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        status = reconnectRequired ? 'reconnect_required' : 'failed';
                        query = "\n      UPDATE content_posts \n      SET status = $2, failure_reason = $3, metadata = '{}'::jsonb, updated_at = NOW()\n      WHERE id = $1\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [id, status, reason])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ContentRepository.prototype.updatePostMetadata = function (id, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE content_posts\n      SET metadata = $2, updated_at = NOW()\n      WHERE id = $1\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [id, metadata])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ContentRepository;
}());
exports.ContentRepository = ContentRepository;
