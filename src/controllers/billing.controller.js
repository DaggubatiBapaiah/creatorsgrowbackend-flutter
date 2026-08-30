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
exports.BillingController = void 0;
var entitlement_service_1 = require("../services/billing/entitlement.service");
var billing_repository_1 = require("../repositories/billing.repository");
var env_1 = require("../config/env");
var crypto_1 = __importDefault(require("crypto"));
var BillingController = /** @class */ (function () {
    function BillingController() {
        var _this = this;
        this.entitlementService = new entitlement_service_1.EntitlementService();
        this.billingRepo = new billing_repository_1.BillingRepository();
        this.getStatus = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, status_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.entitlementService.getSubscriptionStatus(userId)];
                    case 1:
                        status_1 = _a.sent();
                        return [2 /*return*/, res.status(200).json({ status: status_1 })];
                    case 2:
                        error_1 = _a.sent();
                        next(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.createCheckout = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, planCode, mockSubId;
            return __generator(this, function (_a) {
                try {
                    userId = req.user.id;
                    planCode = req.body.planCode;
                    if (!['creator', 'pro'].includes(planCode)) {
                        return [2 /*return*/, res.status(400).json({ error: { message: 'Invalid plan code.' } })];
                    }
                    mockSubId = 'sub_' + Math.random().toString(36).substring(2, 15);
                    return [2 /*return*/, res.status(200).json({
                            subscriptionId: mockSubId,
                            keyId: env_1.env.RAZORPAY_KEY_ID,
                            amount: planCode === 'creator' ? 49900 : 149900,
                            currency: 'INR',
                            name: 'CreatorsGrow',
                            description: planCode.toUpperCase() + ' Subscription Plan',
                        })];
                }
                catch (error) {
                    next(error);
                }
                return [2 /*return*/];
            });
        }); };
        this.handleWebhook = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var signature, shasum, digest, event_1, eventId, eventType, isNewEvent, subscriptionEntity, razorpaySubscriptionId, notes, userId, planCode, rzpStatus, dbStatus, currentPeriodEnd, currentPeriodStart, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        signature = req.headers['x-razorpay-signature'];
                        if (!signature) {
                            return [2 /*return*/, res.status(400).json({ error: { message: 'Missing Razorpay signature header.' } })];
                        }
                        shasum = crypto_1.default.createHmac('sha256', env_1.env.RAZORPAY_WEBHOOK_SECRET);
                        shasum.update(JSON.stringify(req.body));
                        digest = shasum.digest('hex');
                        if (digest !== signature) {
                            return [2 /*return*/, res.status(400).json({ error: { message: 'Invalid signature verification.' } })];
                        }
                        event_1 = req.body;
                        eventId = event_1.id;
                        eventType = event_1.event;
                        return [4 /*yield*/, this.billingRepo.logWebhookEvent(eventId, eventType)];
                    case 1:
                        isNewEvent = _c.sent();
                        if (!isNewEvent) {
                            return [2 /*return*/, res.status(200).json({ status: 'ok', detail: 'Duplicate webhook event filtered.' })];
                        }
                        subscriptionEntity = (_b = (_a = event_1.payload) === null || _a === void 0 ? void 0 : _a.subscription) === null || _b === void 0 ? void 0 : _b.entity;
                        if (!subscriptionEntity) return [3 /*break*/, 3];
                        razorpaySubscriptionId = subscriptionEntity.id;
                        notes = subscriptionEntity.notes || {};
                        userId = notes.userId;
                        if (!userId) return [3 /*break*/, 3];
                        planCode = notes.planCode || 'free';
                        rzpStatus = subscriptionEntity.status;
                        dbStatus = 'active';
                        if (rzpStatus === 'cancelled') {
                            dbStatus = 'cancelled';
                        }
                        else if (rzpStatus === 'pending' || rzpStatus === 'halted') {
                            dbStatus = 'past_due';
                        }
                        else if (rzpStatus === 'completed') {
                            dbStatus = 'active';
                        }
                        currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
                        currentPeriodStart = new Date(subscriptionEntity.current_start * 1000);
                        return [4 /*yield*/, this.billingRepo.createOrUpdateSubscription({
                                user_id: userId,
                                plan_code: planCode,
                                status: dbStatus,
                                razorpay_subscription_id: razorpaySubscriptionId,
                                current_period_start: isNaN(currentPeriodStart.getTime()) ? new Date() : currentPeriodStart,
                                current_period_end: isNaN(currentPeriodEnd.getTime()) ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : currentPeriodEnd,
                                cancel_at_period_end: subscriptionEntity.cancel_at_cycle_end === 1,
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [2 /*return*/, res.status(200).json({ status: 'ok' })];
                    case 4:
                        error_2 = _c.sent();
                        next(error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
    }
    return BillingController;
}());
exports.BillingController = BillingController;
