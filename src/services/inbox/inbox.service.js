"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.InboxService = void 0;
var errors_1 = require("../../utils/errors");
var inbox_repository_1 = require("../../repositories/inbox.repository");
var social_repository_1 = require("../../repositories/social.repository");
var instagram_adapter_1 = require("./instagram.adapter");
var youtube_adapter_1 = require("./youtube.adapter");
var x_adapter_1 = require("./x.adapter");
var InboxService = /** @class */ (function () {
    function InboxService() {
        this.repo = new inbox_repository_1.InboxRepository();
        this.socialRepo = new social_repository_1.SocialRepository();
        this.adapters = {
            instagram: new instagram_adapter_1.InstagramAdapter(),
            youtube: new youtube_adapter_1.YouTubeAdapter(),
            x: new x_adapter_1.XAdapter(),
            facebook: new instagram_adapter_1.InstagramAdapter(), // Meta Graph utilizes similar Graph endpoints
        };
    }
    InboxService.prototype.syncInbox = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, connected, _i, connected_1, acc, adapter, items, _a, items_1, item, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.socialRepo.getAccountsByUserId(userId)];
                    case 1:
                        accounts = _b.sent();
                        connected = accounts.filter(function (a) { return a.status === 'connected'; });
                        _i = 0, connected_1 = connected;
                        _b.label = 2;
                    case 2:
                        if (!(_i < connected_1.length)) return [3 /*break*/, 11];
                        acc = connected_1[_i];
                        adapter = this.adapters[acc.platform.toLowerCase()];
                        if (!adapter) return [3 /*break*/, 10];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 9, , 10]);
                        return [4 /*yield*/, adapter.fetchItems(acc)];
                    case 4:
                        items = _b.sent();
                        _a = 0, items_1 = items;
                        _b.label = 5;
                    case 5:
                        if (!(_a < items_1.length)) return [3 /*break*/, 8];
                        item = items_1[_a];
                        return [4 /*yield*/, this.repo.createOrUpdateItem(__assign(__assign({}, item), { user_id: userId, social_account_id: acc.id }))];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        _a++;
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        e_1 = _b.sent();
                        // Soft-fail: log sync error per platform without crashing the full inbox sync
                        console.error("Failed to sync inbox for ".concat(acc.platform, ": ").concat(e_1.message || e_1));
                        return [3 /*break*/, 10];
                    case 10:
                        _i++;
                        return [3 /*break*/, 2];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    InboxService.prototype.getInboxItems = function (userId_1, filters_1) {
        return __awaiter(this, arguments, void 0, function (userId, filters, limit, offset) {
            if (limit === void 0) { limit = 20; }
            if (offset === void 0) { offset = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Perform live sync prior to fetching list
                    return [4 /*yield*/, this.syncInbox(userId)];
                    case 1:
                        // Perform live sync prior to fetching list
                        _a.sent();
                        return [4 /*yield*/, this.repo.getEngagementItems(userId, filters, limit, offset)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    InboxService.prototype.replyToItem = function (userId, itemId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var item, account, adapter, replyExternalId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.repo.getEngagementItemById(itemId, userId)];
                    case 1:
                        item = _a.sent();
                        if (!item)
                            throw new errors_1.NotFoundError('Engagement item not found.');
                        return [4 /*yield*/, this.socialRepo.findById(item.social_account_id)];
                    case 2:
                        account = _a.sent();
                        if (!account)
                            throw new errors_1.NotFoundError('Associated social account not found.');
                        adapter = this.adapters[item.platform.toLowerCase()];
                        if (!adapter)
                            throw { status: 405, message: 'Platform adapter not supported.' };
                        return [4 /*yield*/, adapter.postReply(account, item.external_id, text)];
                    case 3:
                        replyExternalId = _a.sent();
                        // Mark item as replied
                        return [4 /*yield*/, this.repo.markAsReplied(itemId, userId)];
                    case 4:
                        // Mark item as replied
                        _a.sent();
                        return [2 /*return*/, replyExternalId];
                }
            });
        });
    };
    InboxService.prototype.toggleLike = function (userId, itemId, like) {
        return __awaiter(this, void 0, void 0, function () {
            var item, account, adapter, ok, delta, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.repo.getEngagementItemById(itemId, userId)];
                    case 1:
                        item = _a.sent();
                        if (!item)
                            throw { status: 404, message: 'Engagement item not found.' };
                        return [4 /*yield*/, this.socialRepo.findById(item.social_account_id)];
                    case 2:
                        account = _a.sent();
                        if (!account)
                            throw { status: 404, message: 'Associated social account not found.' };
                        adapter = this.adapters[item.platform.toLowerCase()];
                        if (!adapter)
                            throw { status: 405, message: 'Platform adapter not supported.' };
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, adapter.toggleLike(account, item.external_id, like)];
                    case 4:
                        ok = _a.sent();
                        if (!ok) return [3 /*break*/, 6];
                        delta = like ? 1 : -1;
                        return [4 /*yield*/, this.repo.updateLikeStatus(itemId, userId, like, delta)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, ok];
                    case 7:
                        e_2 = _a.sent();
                        if (e_2.status === 405) {
                            throw e_2; // Reraise unsupported platform API exceptions
                        }
                        throw { status: 502, message: 'External API failure' };
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    InboxService.prototype.toggleHide = function (userId, itemId, hide) {
        return __awaiter(this, void 0, void 0, function () {
            var item, account, adapter, ok;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.repo.getEngagementItemById(itemId, userId)];
                    case 1:
                        item = _a.sent();
                        if (!item)
                            throw { status: 404, message: 'Engagement item not found.' };
                        return [4 /*yield*/, this.socialRepo.findById(item.social_account_id)];
                    case 2:
                        account = _a.sent();
                        if (!account)
                            throw { status: 404, message: 'Associated social account not found.' };
                        adapter = this.adapters[item.platform.toLowerCase()];
                        if (!adapter)
                            throw { status: 405, message: 'Platform adapter not supported.' };
                        return [4 /*yield*/, adapter.toggleHide(account, item.external_id, hide)];
                    case 3:
                        ok = _a.sent();
                        if (!ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.repo.updateHideStatus(itemId, userId, hide)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, ok];
                }
            });
        });
    };
    InboxService.prototype.deleteItem = function (userId, itemId) {
        return __awaiter(this, void 0, void 0, function () {
            var item, account, adapter, ok;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.repo.getEngagementItemById(itemId, userId)];
                    case 1:
                        item = _a.sent();
                        if (!item)
                            throw { status: 404, message: 'Engagement item not found.' };
                        return [4 /*yield*/, this.socialRepo.findById(item.social_account_id)];
                    case 2:
                        account = _a.sent();
                        if (!account)
                            throw { status: 404, message: 'Associated social account not found.' };
                        adapter = this.adapters[item.platform.toLowerCase()];
                        if (!adapter)
                            throw { status: 405, message: 'Platform adapter not supported.' };
                        return [4 /*yield*/, adapter.deleteItem(account, item.external_id)];
                    case 3:
                        ok = _a.sent();
                        if (!ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.repo.deleteItem(itemId, userId)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, ok];
                }
            });
        });
    };
    InboxService.prototype.markAsRead = function (userId, itemId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.repo.markAsRead(itemId, userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return InboxService;
}());
exports.InboxService = InboxService;
