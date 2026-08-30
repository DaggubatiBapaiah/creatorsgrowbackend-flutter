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
exports.MediaKitController = void 0;
var mediakit_repository_1 = require("../repositories/mediakit.repository");
var errors_1 = require("../utils/errors");
var zod_1 = require("zod");
var updateConfigSchema = zod_1.z.object({
    customBio: zod_1.z.string().max(1000).nullable().optional(),
    contactEmail: zod_1.z.string().email().nullable().or(zod_1.z.literal('')).optional(),
    showInstagram: zod_1.z.boolean().optional(),
    showTiktok: zod_1.z.boolean().optional(),
    rates: zod_1.z.array(zod_1.z.object({
        service: zod_1.z.string().min(1),
        rate: zod_1.z.number().nonnegative()
    })).optional()
});
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined)
        return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
var MediaKitController = /** @class */ (function () {
    function MediaKitController() {
        var _this = this;
        this.mediaKitRepo = new mediakit_repository_1.MediaKitRepository();
        this.getConfig = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, config, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        return [4 /*yield*/, this.mediaKitRepo.getConfigByUserId(userId)];
                    case 1:
                        config = _a.sent();
                        // Return defaults if configuration does not exist yet
                        if (!config) {
                            config = {
                                id: '',
                                user_id: userId,
                                custom_bio: '',
                                contact_email: '',
                                show_instagram: true,
                                show_tiktok: true,
                                rates: [],
                                views_count: 0,
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                        }
                        res.json({ data: { config: config } });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        next(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.saveConfig = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var userId, validated, config, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = req.user.id;
                        validated = updateConfigSchema.parse(req.body);
                        return [4 /*yield*/, this.mediaKitRepo.createOrUpdateConfig(userId, (_a = validated.customBio) !== null && _a !== void 0 ? _a : null, validated.contactEmail || null, validated.showInstagram, validated.showTiktok, validated.rates)];
                    case 1:
                        config = _b.sent();
                        res.json({ data: { config: config } });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _b.sent();
                        if (error_2 instanceof zod_1.z.ZodError) {
                            next(new errors_1.ValidationError('Invalid configuration input data', error_2.errors));
                            return [2 /*return*/];
                        }
                        next(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.renderPublicKit = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var identifier, data, user, platforms, topPosts, totalFollowers, totalReach, totalImpressions, ratesHtml, platformsHtml, topPostsHtml, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        identifier = req.params.identifier;
                        return [4 /*yield*/, this.mediaKitRepo.getPublicKitData(identifier)];
                    case 1:
                        data = _a.sent();
                        if (!data) {
                            res.status(404).send("\n          <html>\n            <head>\n              <title>Media Kit Not Found - CreatorsGrow</title>\n              <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n              <style>\n                body { background-color: #0f0f17; color: #f3f4f6; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\n                .card { background: rgba(255, 255, 255, 0.05); padding: 2.5rem; border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); text-align: center; max-width: 400px; }\n                h1 { color: #f43f5e; margin-top: 0; }\n                p { color: #9ca3af; margin-bottom: 2rem; }\n                a { color: #6366f1; text-decoration: none; font-weight: bold; border: 1px solid #6366f1; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background 0.2s; }\n                a:hover { background: #6366f1; color: white; }\n              </style>\n            </head>\n            <body>\n              <div class=\"card\">\n                <h1>404</h1>\n                <p>The requested CreatorsGrow Media Kit could not be found. Verify the name or user ID and try again.</p>\n                <a href=\"https://creatorsgrow.com\">Go to CreatorsGrow</a>\n              </div>\n            </body>\n          </html>\n        ");
                            return [2 /*return*/];
                        }
                        user = data.user, platforms = data.platforms, topPosts = data.topPosts;
                        totalFollowers = platforms.reduce(function (acc, curr) { return acc + curr.followers; }, 0);
                        totalReach = platforms.reduce(function (acc, curr) { return acc + curr.reach_24h; }, 0);
                        totalImpressions = platforms.reduce(function (acc, curr) { return acc + curr.impressions_24h; }, 0);
                        ratesHtml = user.rates && user.rates.length > 0
                            ? user.rates.map(function (r) { return "\n            <div class=\"rate-item\">\n              <span class=\"rate-service\">".concat(escapeHtml(r.service), "</span>\n              <span class=\"rate-value\">$").concat(escapeHtml(r.rate), "</span>\n            </div>\n          "); }).join('')
                            : "<p class=\"no-data\">Rates available upon request.</p>";
                        platformsHtml = platforms.map(function (p) { return "\n        <div class=\"platform-card\">\n          <div class=\"platform-header\">\n            <span class=\"platform-badge ".concat(p.platform.toLowerCase(), "\">").concat(p.platform.toUpperCase(), "</span>\n            <span class=\"platform-username\">@").concat(escapeHtml(p.username), "</span>\n          </div>\n          <div class=\"platform-stats\">\n            <div class=\"stat-box\">\n              <span class=\"stat-num\">").concat(escapeHtml(p.followers.toLocaleString()), "</span>\n              <span class=\"stat-label\">Followers</span>\n            </div>\n            <div class=\"stat-box\">\n              <span class=\"stat-num\">").concat(escapeHtml(p.reach_24h.toLocaleString()), "</span>\n              <span class=\"stat-label\">24h Reach</span>\n            </div>\n          </div>\n        </div>\n      "); }).join('');
                        topPostsHtml = topPosts && topPosts.length > 0
                            ? topPosts.map(function (post) {
                                var formattedEngagement = (parseFloat(post.engagement_rate) * 100).toFixed(2);
                                return "\n              <div class=\"post-card\">\n                <div class=\"post-badge-container\">\n                  <span class=\"post-platform-badge ".concat(post.platform.toLowerCase(), "\">").concat(post.platform, "</span>\n                  <span class=\"post-date\">").concat(new Date(post.published_at).toLocaleDateString(), "</span>\n                </div>\n                <p class=\"post-caption\">").concat(escapeHtml(post.caption || 'No caption'), "</p>\n                <div class=\"post-metrics\">\n                  <div class=\"post-metric\">\n                    <span class=\"metric-val\">").concat(escapeHtml(post.likes.toLocaleString()), "</span>\n                    <span class=\"metric-lbl\">Likes</span>\n                  </div>\n                  <div class=\"post-metric\">\n                    <span class=\"metric-val\">").concat(escapeHtml(post.comments.toLocaleString()), "</span>\n                    <span class=\"metric-lbl\">Comments</span>\n                  </div>\n                  <div class=\"post-metric accent\">\n                    <span class=\"metric-val\">").concat(escapeHtml(formattedEngagement), "%</span>\n                    <span class=\"metric-lbl\">Engagement</span>\n                  </div>\n                </div>\n              </div>\n            ");
                            }).join('')
                            : "<p class=\"no-data\">No published posts stats synchronized yet.</p>";
                        res.send("\n        <!DOCTYPE html>\n        <html lang=\"en\">\n        <head>\n          <meta charset=\"UTF-8\">\n          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n          <title>".concat(user.display_name, " - Platform-Synced Media Kit - CreatorsGrow</title>\n          <style>\n            :root {\n              --bg-color: #0b0c10;\n              --surface-color: #1f2833;\n              --text-primary: #f3f4f6;\n              --text-secondary: #9ca3af;\n              --primary: #ec4899;\n              --secondary: #6366f1;\n              --glass: rgba(255, 255, 255, 0.03);\n              --border: rgba(255, 255, 255, 0.08);\n            }\n            body {\n              background-color: var(--bg-color);\n              color: var(--text-primary);\n              font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n              margin: 0;\n              padding: 0;\n              line-height: 1.5;\n            }\n            .container {\n              max-width: 900px;\n              margin: 0 auto;\n              padding: 2rem 1rem;\n            }\n            header {\n              text-align: center;\n              padding: 3rem 1.5rem;\n              background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1));\n              border-radius: 1.5rem;\n              border: 1px solid var(--border);\n              margin-bottom: 2rem;\n              box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);\n              backdrop-filter: blur(10px);\n            }\n            .avatar-placeholder {\n              width: 90px;\n              height: 90px;\n              background: linear-gradient(45deg, var(--primary), var(--secondary));\n              border-radius: 50%;\n              margin: 0 auto 1rem;\n              display: flex;\n              align-items: center;\n              justify-content: center;\n              font-size: 2rem;\n              font-weight: bold;\n              box-shadow: 0 0 20px rgba(236,72,153,0.4);\n            }\n            h1 {\n              margin: 0 0 0.5rem;\n              font-size: 2.25rem;\n              font-weight: 800;\n              background: linear-gradient(to right, #ffffff, #e2e8f0);\n              -webkit-background-clip: text;\n              -webkit-text-fill-color: transparent;\n            }\n            .badge-verified {\n              display: inline-flex;\n              align-items: center;\n              gap: 0.25rem;\n              background: rgba(99, 102, 241, 0.2);\n              border: 1px solid var(--secondary);\n              color: #a5b4fc;\n              padding: 0.25rem 0.75rem;\n              border-radius: 9999px;\n              font-size: 0.75rem;\n              font-weight: 600;\n              margin-bottom: 1rem;\n              text-transform: uppercase;\n              letter-spacing: 0.05em;\n            }\n            .bio {\n              color: var(--text-secondary);\n              max-width: 600px;\n              margin: 0 auto 1.5rem;\n              font-size: 1rem;\n            }\n            .btn-contact {\n              display: inline-flex;\n              align-items: center;\n              background: var(--primary);\n              color: white;\n              text-decoration: none;\n              padding: 0.75rem 1.5rem;\n              border-radius: 0.75rem;\n              font-weight: 600;\n              font-size: 0.875rem;\n              transition: transform 0.2s, box-shadow 0.2s;\n            }\n            .btn-contact:hover {\n              transform: translateY(-2px);\n              box-shadow: 0 10px 15px -3px rgba(236, 72, 153, 0.3);\n            }\n            \n            /* Overview stats */\n            .overview-grid {\n              display: grid;\n              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n              gap: 1rem;\n              margin-bottom: 2rem;\n            }\n            .overview-card {\n              background: var(--glass);\n              border: 1px solid var(--border);\n              border-radius: 1rem;\n              padding: 1.5rem;\n              text-align: center;\n              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n            }\n            .overview-num {\n              display: block;\n              font-size: 2rem;\n              font-weight: 800;\n              color: var(--text-primary);\n              margin-bottom: 0.25rem;\n            }\n            .overview-label {\n              font-size: 0.75rem;\n              text-transform: uppercase;\n              letter-spacing: 0.05em;\n              color: var(--text-secondary);\n              font-weight: 600;\n            }\n\n            .section-title {\n              font-size: 1.25rem;\n              font-weight: 700;\n              margin-bottom: 1rem;\n              display: flex;\n              align-items: center;\n              gap: 0.5rem;\n              border-bottom: 1px solid var(--border);\n              padding-bottom: 0.5rem;\n              color: #f3f4f6;\n            }\n            \n            /* Platforms */\n            .platforms-section {\n              margin-bottom: 2.5rem;\n            }\n            .platforms-grid {\n              display: grid;\n              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n              gap: 1.25rem;\n            }\n            .platform-card {\n              background: var(--glass);\n              border: 1px solid var(--border);\n              border-radius: 1rem;\n              padding: 1.5rem;\n              transition: border-color 0.2s;\n            }\n            .platform-card:hover {\n              border-color: rgba(99, 102, 241, 0.4);\n            }\n            .platform-header {\n              display: flex;\n              align-items: center;\n              justify-content: space-between;\n              margin-bottom: 1.25rem;\n            }\n            .platform-badge {\n              font-size: 0.75rem;\n              font-weight: 700;\n              padding: 0.25rem 0.5rem;\n              border-radius: 0.375rem;\n              letter-spacing: 0.05em;\n            }\n            .platform-badge.instagram {\n              background-color: rgba(225, 48, 108, 0.2);\n              color: #ff8da1;\n              border: 1px solid rgba(225, 48, 108, 0.3);\n            }\n            .platform-badge.tiktok {\n              background-color: rgba(0, 0, 0, 0.4);\n              color: #00f2fe;\n              border: 1px solid rgba(0, 242, 254, 0.3);\n            }\n            .platform-username {\n              font-weight: 600;\n              font-size: 0.9rem;\n              color: var(--text-primary);\n            }\n            .platform-stats {\n              display: grid;\n              grid-template-columns: 1fr 1fr;\n              gap: 1rem;\n            }\n            .stat-box {\n              background: rgba(255, 255, 255, 0.02);\n              padding: 0.75rem;\n              border-radius: 0.5rem;\n              border: 1px solid rgba(255, 255, 255, 0.04);\n            }\n            .stat-num {\n              display: block;\n              font-size: 1.25rem;\n              font-weight: 700;\n              margin-bottom: 0.125rem;\n            }\n            .stat-label {\n              font-size: 0.7rem;\n              color: var(--text-secondary);\n              text-transform: uppercase;\n              letter-spacing: 0.02em;\n            }\n\n            /* Rates */\n            .rates-section {\n              margin-bottom: 2.5rem;\n            }\n            .rates-grid {\n              display: grid;\n              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n              gap: 1rem;\n            }\n            .rate-item {\n              background: var(--glass);\n              border: 1px solid var(--border);\n              border-radius: 0.75rem;\n              padding: 1rem;\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n            }\n            .rate-service {\n              font-weight: 600;\n              font-size: 0.9rem;\n            }\n            .rate-value {\n              font-weight: 800;\n              color: var(--primary);\n              font-size: 1.1rem;\n            }\n\n            /* Top Posts */\n            .posts-section {\n              margin-bottom: 3rem;\n            }\n            .posts-grid {\n              display: grid;\n              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));\n              gap: 1.25rem;\n            }\n            .post-card {\n              background: var(--glass);\n              border: 1px solid var(--border);\n              border-radius: 1rem;\n              padding: 1.25rem;\n              display: flex;\n              flex-direction: column;\n              height: 220px;\n            }\n            .post-badge-container {\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n              margin-bottom: 0.75rem;\n            }\n            .post-platform-badge {\n              font-size: 0.65rem;\n              font-weight: 700;\n              padding: 0.125rem 0.375rem;\n              border-radius: 0.25rem;\n              text-transform: uppercase;\n            }\n            .post-platform-badge.instagram { background: rgba(225, 48, 108, 0.15); color: #ff8da1; }\n            .post-platform-badge.tiktok { background: rgba(0, 242, 254, 0.15); color: #00f2fe; }\n            .post-date {\n              font-size: 0.75rem;\n              color: var(--text-secondary);\n            }\n            .post-caption {\n              font-size: 0.875rem;\n              color: var(--text-primary);\n              margin: 0 0 1rem;\n              display: -webkit-box;\n              -webkit-line-clamp: 3;\n              -webkit-box-orient: vertical;\n              overflow: hidden;\n              flex-grow: 1;\n            }\n            .post-metrics {\n              display: grid;\n              grid-template-columns: repeat(3, 1fr);\n              gap: 0.5rem;\n              border-top: 1px solid rgba(255, 255, 255, 0.05);\n              padding-top: 0.75rem;\n            }\n            .post-metric {\n              text-align: center;\n            }\n            .post-metric.accent .metric-val {\n              color: var(--primary);\n            }\n            .metric-val {\n              display: block;\n              font-size: 0.9rem;\n              font-weight: 700;\n            }\n            .metric-lbl {\n              display: block;\n              font-size: 0.65rem;\n              color: var(--text-secondary);\n              text-transform: uppercase;\n            }\n            \n            .no-data {\n              color: var(--text-secondary);\n              font-style: italic;\n              font-size: 0.9rem;\n            }\n            \n            footer {\n              text-align: center;\n              padding: 2rem 0;\n              font-size: 0.75rem;\n              color: var(--text-secondary);\n              border-top: 1px solid var(--border);\n              margin-top: 2rem;\n            }\n            footer a {\n              color: var(--secondary);\n              text-decoration: none;\n              font-weight: bold;\n            }\n          </style>\n        </head>\n        <body>\n          <div class=\"container\">\n            <header>\n              <div class=\"avatar-placeholder\">").concat(escapeHtml(user.display_name.charAt(0).toUpperCase()), "</div>\n              <h1>").concat(escapeHtml(user.display_name), "</h1>\n              <div class=\"badge-verified\">\u2713 Platform-Synced Audience</div>\n              <p class=\"bio\">").concat(escapeHtml(user.custom_bio || 'Welcome to my official media kit.'), "</p>\n              ").concat(user.contact_email ? "<a href=\"mailto:".concat(escapeHtml(user.contact_email), "\" class=\"btn-contact\">Contact Me</a>") : '', "\n            </header>\n\n            <!-- Overall stats card -->\n            <div class=\"overview-grid\">\n              <div class=\"overview-card\">\n                <span class=\"overview-num\">").concat(escapeHtml(totalFollowers.toLocaleString()), "</span>\n                <span class=\"overview-label\">Total Reach Base</span>\n              </div>\n              <div class=\"overview-card\">\n                <span class=\"overview-num\">").concat(escapeHtml(totalReach.toLocaleString()), "</span>\n                <span class=\"overview-label\">24h Audience Reach</span>\n              </div>\n              <div class=\"overview-card\">\n                <span class=\"overview-num\">").concat(escapeHtml(user.views_count.toLocaleString()), "</span>\n                <span class=\"overview-label\">Kit Page Views</span>\n              </div>\n            </div>\n\n            <!-- Connected Platforms Stats -->\n            <div class=\"platforms-section\">\n              <div class=\"section-title\">Connected Channels</div>\n              <div class=\"platforms-grid\">\n                ").concat(platformsHtml, "\n              </div>\n            </div>\n\n            <!-- Custom Partnership Rates -->\n            <div class=\"rates-section\">\n              <div class=\"section-title\">Partnership Rates</div>\n              <div class=\"rates-grid\">\n                ").concat(ratesHtml, "\n              </div>\n            </div>\n\n            <!-- Best Posts Insights -->\n            <div class=\"posts-section\">\n              <div class=\"section-title\">Top Performing Content</div>\n              <div class=\"posts-grid\">\n                ").concat(topPostsHtml, "\n              </div>\n            </div>\n\n            <footer>\n              <p>Audience stats synced from connected platforms.</p>\n              <p>Powered by <a href=\"https://creatorsgrow.com\">CreatorsGrow</a></p>\n            </footer>\n          </div>\n        </body>\n        </html>\n      "));
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        next(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    }
    return MediaKitController;
}());
exports.MediaKitController = MediaKitController;
