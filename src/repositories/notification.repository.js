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
exports.NotificationRepository = void 0;
var db_1 = require("../config/db");
var NotificationRepository = /** @class */ (function () {
    function NotificationRepository() {
    }
    NotificationRepository.prototype.getPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.pool.query('SELECT * FROM notification_preferences WHERE user_id = $1', [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    NotificationRepository.prototype.getPreferenceByCategory = function (userId, category) {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.pool.query('SELECT * FROM notification_preferences WHERE user_id = $1 AND category = $2', [userId, category])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    NotificationRepository.prototype.savePreference = function (pref) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO notification_preferences (user_id, category, email_enabled, push_enabled, in_app_enabled)\n      VALUES ($1, $2, $3, $4, $5)\n      ON CONFLICT (user_id, category) DO UPDATE\n      SET email_enabled = $3, push_enabled = $4, in_app_enabled = $5\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [pref.user_id, pref.category, pref.email_enabled, pref.push_enabled, pref.in_app_enabled])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    NotificationRepository.prototype.createNotification = function (userId, category, title, body, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO notifications (user_id, category, title, body, metadata)\n      VALUES ($1, $2, $3, $4, $5)\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId, category, title, body, metadata ? JSON.stringify(metadata) : null])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    NotificationRepository.prototype.getNotifications = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit, offset) {
            var query, rows;
            if (limit === void 0) { limit = 20; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
                        return [4 /*yield*/, db_1.pool.query(query, [userId, limit, offset])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    NotificationRepository.prototype.markAsRead = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rowCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2';
                        return [4 /*yield*/, db_1.pool.query(query, [id, userId])];
                    case 1:
                        rowCount = (_a.sent()).rowCount;
                        return [2 /*return*/, (rowCount !== null && rowCount !== void 0 ? rowCount : 0) > 0];
                }
            });
        });
    };
    NotificationRepository.prototype.createDelivery = function (notificationId, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      INSERT INTO notification_deliveries (notification_id, channel, status)\n      VALUES ($1, $2, 'pending')\n      RETURNING *\n    ";
                        return [4 /*yield*/, db_1.pool.query(query, [notificationId, channel])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    NotificationRepository.prototype.updateDelivery = function (id, update) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, setClause, values, query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keys = Object.keys(update);
                        setClause = keys.map(function (k, i) {
                            // Map camelCase to snake_case for DB columns
                            if (k === 'retry_count')
                                return "retry_count = $".concat(i + 2);
                            if (k === 'error_message')
                                return "error_message = $".concat(i + 2);
                            if (k === 'last_attempt_at')
                                return "last_attempt_at = $".concat(i + 2);
                            return "".concat(k, " = $").concat(i + 2);
                        }).join(', ');
                        values = keys.map(function (k) { return update[k]; });
                        query = "\n      UPDATE notification_deliveries \n      SET ".concat(setClause, " \n      WHERE id = $1 \n      RETURNING *\n    ");
                        return [4 /*yield*/, db_1.pool.query(query, __spreadArray([id], values, true))];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    NotificationRepository.prototype.getPendingDeliveries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.pool.query("SELECT * FROM notification_deliveries WHERE status = 'pending' OR status = 'failed'")];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    return NotificationRepository;
}());
exports.NotificationRepository = NotificationRepository;
