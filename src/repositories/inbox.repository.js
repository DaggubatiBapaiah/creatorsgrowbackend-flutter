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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxRepository = void 0;
var db_1 = require("../config/db");
var InboxRepository = /** @class */ (function () {
    function InboxRepository() {
    }
    InboxRepository.prototype.getEngagementItems = function (userId_1, filters_1) {
        return __awaiter(this, arguments, void 0, function (userId, filters, limit, offset) {
            var query, params, paramIndex, rows;
            if (limit === void 0) { limit = 20; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      SELECT * FROM engagement_items\n      WHERE user_id = $1\n    ";
                        params = [userId];
                        paramIndex = 2;
                        if (filters.platform) {
                            query += " AND platform = $".concat(paramIndex);
                            params.push(filters.platform.toLowerCase());
                            paramIndex++;
                        }
                        if (filters.status) {
                            if (filters.status === 'unread') {
                                query += " AND is_read = false";
                            }
                            else if (filters.status === 'replied') {
                                query += " AND is_replied = true";
                            }
                        }
                        if (filters.search) {
                            query += " AND (content ILIKE $".concat(paramIndex, " OR author_name ILIKE $").concat(paramIndex, ")");
                            params.push("%".concat(filters.search, "%"));
                            paramIndex++;
                        }
                        query += " ORDER BY created_at DESC LIMIT $".concat(paramIndex, " OFFSET $").concat(paramIndex + 1);
                        params.push(limit, offset);
                        return [4 /*yield*/, db_1.pool.query(query, params)];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    InboxRepository.prototype.getEngagementItemById = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM engagement_items WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    InboxRepository.prototype.createOrUpdateItem = function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, keys, setClause, values, query, rows, keys, columns, columnsStr, placeholders, values, query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.pool.query('SELECT id FROM engagement_items WHERE external_id = $1', [item.external_id])];
                    case 1:
                        existing = _a.sent();
                        if (!(existing.rows.length > 0)) return [3 /*break*/, 3];
                        keys = Object.keys(item).filter(function (k) { return k !== 'external_id' && k !== 'user_id'; });
                        setClause = keys.map(function (k, i) { return "".concat(k, " = $").concat(i + 2); }).join(', ');
                        values = keys.map(function (k) { return item[k]; });
                        query = "\n        UPDATE engagement_items \n        SET ".concat(setClause, ", updated_at = NOW() \n        WHERE external_id = $1 \n        RETURNING *\n      ");
                        return [4 /*yield*/, db_1.pool.query(query, __spreadArray([item.external_id], values, true))];
                    case 2:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                    case 3:
                        keys = Object.keys(item);
                        columns = keys.map(function (k) {
                            // Map camelCase to snake_case for DB columns
                            if (k === 'socialAccountId')
                                return 'social_account_id';
                            if (k === 'itemType')
                                return 'item_type';
                            if (k === 'authorName')
                                return 'author_name';
                            if (k === 'authorAvatarUrl')
                                return 'author_avatar_url';
                            if (k === 'externalId')
                                return 'external_id';
                            if (k === 'parentExternalId')
                                return 'parent_external_id';
                            if (k === 'postExternalId')
                                return 'post_external_id';
                            if (k === 'isRead')
                                return 'is_read';
                            if (k === 'isReplied')
                                return 'is_replied';
                            if (k === 'likeCount')
                                return 'like_count';
                            if (k === 'userId')
                                return 'user_id';
                            return k;
                        });
                        columnsStr = columns.join(', ');
                        placeholders = keys.map(function (_, i) { return "$".concat(i + 1); }).join(', ');
                        values = keys.map(function (k) { return item[k]; });
                        query = "\n        INSERT INTO engagement_items (".concat(columnsStr, ", updated_at)\n        VALUES (").concat(placeholders, ", NOW())\n        RETURNING *\n      ");
                        return [4 /*yield*/, db_1.pool.query(query, values)];
                    case 4:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    InboxRepository.prototype.markAsRead = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'UPDATE engagement_items SET is_read = true, updated_at = NOW() WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    InboxRepository.prototype.markAsReplied = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'UPDATE engagement_items SET is_replied = true, updated_at = NOW() WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    InboxRepository.prototype.deleteItem = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'DELETE FROM engagement_items WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    InboxRepository.prototype.updateLikeStatus = function (id, userId, isLiked, likeCountDelta) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE engagement_items \n      SET like_count = like_count + $1, \n          metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isLiked}', $2::jsonb),\n          updated_at = NOW()\n      WHERE id = $3 AND user_id = $4\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [likeCountDelta, JSON.stringify(isLiked), id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    InboxRepository.prototype.updateHideStatus = function (id, userId, isHidden) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE engagement_items \n      SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isHidden}', $1::jsonb),\n          updated_at = NOW()\n      WHERE id = $2 AND user_id = $3\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [JSON.stringify(isHidden), id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    return InboxRepository;
}());
exports.InboxRepository = InboxRepository;
