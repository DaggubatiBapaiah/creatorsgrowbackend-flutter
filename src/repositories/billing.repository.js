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
exports.BillingRepository = void 0;
var db_1 = require("../config/db");
var BillingRepository = /** @class */ (function () {
    function BillingRepository() {
    }
    BillingRepository.prototype.getSubscriptionByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM subscriptions WHERE user_id = $1';
                        return [4 /*yield*/, db_1.pool.query(query, [userId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    BillingRepository.prototype.createOrUpdateSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, keys, setClause, values, query, rows, keys, columns, placeholders, values, query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSubscriptionByUserId(subscription.user_id)];
                    case 1:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 3];
                        keys = Object.keys(subscription).filter(function (k) { return k !== 'user_id'; });
                        setClause = keys.map(function (k, i) { return "".concat(k, " = $").concat(i + 2); }).join(', ');
                        values = keys.map(function (k) { return subscription[k]; });
                        query = "\n        UPDATE subscriptions \n        SET ".concat(setClause, ", updated_at = NOW() \n        WHERE user_id = $1 \n        RETURNING *\n      ");
                        return [4 /*yield*/, db_1.pool.query(query, __spreadArray([subscription.user_id], values, true))];
                    case 2:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                    case 3:
                        keys = Object.keys(subscription);
                        columns = keys.join(', ');
                        placeholders = keys.map(function (_, i) { return "$".concat(i + 1); }).join(', ');
                        values = keys.map(function (k) { return subscription[k]; });
                        query = "\n        INSERT INTO subscriptions (".concat(columns, ", updated_at)\n        VALUES (").concat(placeholders, ", NOW())\n        RETURNING *\n      ");
                        return [4 /*yield*/, db_1.pool.query(query, values)];
                    case 4:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    BillingRepository.prototype.getSubscriptionByRazorpayId = function (razorpaySubscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = 'SELECT * FROM subscriptions WHERE razorpay_subscription_id = $1';
                        return [4 /*yield*/, db_1.pool.query(query, [razorpaySubscriptionId])];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows[0] || null];
                }
            });
        });
    };
    BillingRepository.prototype.logWebhookEvent = function (eventId, eventType) {
        return __awaiter(this, void 0, void 0, function () {
            var query, rows, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        query = "\n        INSERT INTO razorpay_webhook_logs (id, event_type, processed_at)\n        VALUES ($1, $2, NOW())\n        ON CONFLICT (id) DO NOTHING\n        RETURNING id\n      ";
                        return [4 /*yield*/, db_1.pool.query(query, [eventId, eventType])];
                    case 1:
                        rows = (_b.sent()).rows;
                        return [2 /*return*/, rows.length > 0];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BillingRepository.prototype.getMonthlyUsageCount = function (userId, type) {
        return __awaiter(this, void 0, void 0, function () {
            var sub, start, end, query, rows, query, rows;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.getSubscriptionByUserId(userId)];
                    case 1:
                        sub = _e.sent();
                        if (!sub)
                            return [2 /*return*/, 0];
                        start = sub.current_period_start;
                        end = sub.current_period_end;
                        if (!(type === 'posts')) return [3 /*break*/, 3];
                        query = "\n        SELECT COUNT(*)::int as count \n        FROM content_posts \n        WHERE user_id = $1 AND created_at BETWEEN $2 AND $3\n      ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId, start, end])];
                    case 2:
                        rows = (_e.sent()).rows;
                        return [2 /*return*/, (_b = (_a = rows[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0];
                    case 3:
                        query = "\n        SELECT COUNT(*)::int as count \n        FROM content_posts \n        WHERE user_id = $1 AND ai_generated = true AND created_at BETWEEN $2 AND $3\n      ";
                        return [4 /*yield*/, db_1.pool.query(query, [userId, start, end])];
                    case 4:
                        rows = (_e.sent()).rows;
                        return [2 /*return*/, (_d = (_c = rows[0]) === null || _c === void 0 ? void 0 : _c.count) !== null && _d !== void 0 ? _d : 0];
                }
            });
        });
    };
    return BillingRepository;
}());
exports.BillingRepository = BillingRepository;
