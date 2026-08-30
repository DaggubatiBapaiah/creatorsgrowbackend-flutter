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
exports.CrmController = void 0;
var crm_repository_1 = require("../repositories/crm.repository");
var entitlement_service_1 = require("../services/billing/entitlement.service");
var db_1 = require("../config/db");
var errors_1 = require("../utils/errors");
var zod_1 = require("zod");
var createDealSchema = zod_1.z.object({
    brandName: zod_1.z.string().min(1).max(255),
    dealValue: zod_1.z.number().nonnegative().optional(),
    stage: zod_1.z.enum(['pitching', 'negotiating', 'signed', 'completed', 'paid']).optional(),
    contactPerson: zod_1.z.string().max(255).nullable().optional(),
    contactEmail: zod_1.z.string().email().nullable().or(zod_1.z.literal('')).optional(),
    notes: zod_1.z.string().nullable().optional(),
    associatedPostId: zod_1.z.string().uuid().nullable().optional()
});
var updateDealSchema = createDealSchema.partial();
var CrmController = /** @class */ (function () {
    function CrmController() {
        var _this = this;
        this.crmRepo = new crm_repository_1.CrmRepository();
        this.entitlementService = new entitlement_service_1.EntitlementService();
        this.checkAccess = function (userId, res) { return __awaiter(_this, void 0, void 0, function () {
            var hasAccess;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.entitlementService.hasFeatureAccess(userId, 'crm')];
                    case 1:
                        hasAccess = _a.sent();
                        if (!hasAccess) {
                            res.status(403).json({ error: { message: 'CRM is a Pro feature. Please upgrade your plan.' } });
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        }); };
        this.createDeal = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, validated, rows, deal, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.checkAccess(userId, res)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        validated = createDealSchema.parse(req.body);
                        if (!validated.associatedPostId) return [3 /*break*/, 3];
                        return [4 /*yield*/, db_1.pool.query('SELECT id FROM content_posts WHERE id = $1 AND user_id = $2', [validated.associatedPostId, userId])];
                    case 2:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0) {
                            res.status(400).json({ error: { message: 'Invalid associated post ID (does not exist or not owned by you)' } });
                            return [2 /*return*/];
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.crmRepo.createDeal(userId, validated.brandName, validated.dealValue, validated.stage, validated.contactPerson, validated.contactEmail || null, validated.notes, validated.associatedPostId)];
                    case 4:
                        deal = _a.sent();
                        res.status(201).json({ data: { deal: deal } });
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        if (error_1 instanceof zod_1.z.ZodError) {
                            next(new errors_1.ValidationError('Invalid deal input data', error_1.errors));
                            return [2 /*return*/];
                        }
                        next(error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.updateDeal = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, validated, existing, rows, updated, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.checkAccess(userId, res)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        id = req.params.id;
                        validated = updateDealSchema.parse(req.body);
                        return [4 /*yield*/, this.crmRepo.getDealById(id, userId)];
                    case 2:
                        existing = _a.sent();
                        if (!existing) {
                            res.status(404).json({ error: { message: 'Deal not found' } });
                            return [2 /*return*/];
                        }
                        if (!validated.associatedPostId) return [3 /*break*/, 4];
                        return [4 /*yield*/, db_1.pool.query('SELECT id FROM content_posts WHERE id = $1 AND user_id = $2', [validated.associatedPostId, userId])];
                    case 3:
                        rows = (_a.sent()).rows;
                        if (rows.length === 0) {
                            res.status(400).json({ error: { message: 'Invalid associated post ID (does not exist or not owned by you)' } });
                            return [2 /*return*/];
                        }
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.crmRepo.updateDeal(id, userId, {
                            brand_name: validated.brandName,
                            deal_value: validated.dealValue,
                            stage: validated.stage,
                            contact_person: validated.contactPerson,
                            contact_email: validated.contactEmail || null,
                            notes: validated.notes,
                            associated_post_id: validated.associatedPostId
                        })];
                    case 5:
                        updated = _a.sent();
                        res.json({ data: { deal: updated } });
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        if (error_2 instanceof zod_1.z.ZodError) {
                            next(new errors_1.ValidationError('Invalid deal update input data', error_2.errors));
                            return [2 /*return*/];
                        }
                        next(error_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        this.getDeals = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, deals, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.checkAccess(userId, res)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        return [4 /*yield*/, this.crmRepo.getDealsByUser(userId)];
                    case 2:
                        deals = _a.sent();
                        res.json({ data: { deals: deals } });
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        next(error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.getDealById = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, deal, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.checkAccess(userId, res)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        id = req.params.id;
                        return [4 /*yield*/, this.crmRepo.getDealById(id, userId)];
                    case 2:
                        deal = _a.sent();
                        if (!deal) {
                            res.status(404).json({ error: { message: 'Deal not found' } });
                            return [2 /*return*/];
                        }
                        res.json({ data: { deal: deal } });
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        next(error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.deleteDeal = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, id, success, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.checkAccess(userId, res)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        id = req.params.id;
                        return [4 /*yield*/, this.crmRepo.deleteDeal(id, userId)];
                    case 2:
                        success = _a.sent();
                        if (!success) {
                            res.status(404).json({ error: { message: 'Deal not found or not owned by user' } });
                            return [2 /*return*/];
                        }
                        res.json({ data: { status: 'ok' } });
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        next(error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    }
    return CrmController;
}());
exports.CrmController = CrmController;
