"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var env_1 = require("./config/env");
var auth_routes_1 = __importDefault(require("./routes/auth.routes"));
var health_routes_1 = __importDefault(require("./routes/health.routes"));
var social_routes_1 = __importDefault(require("./routes/social.routes"));
var content_routes_1 = require("./routes/content.routes");
var media_routes_1 = require("./routes/media.routes");
var analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
var growth_routes_1 = __importDefault(require("./routes/growth.routes"));
var ai_routes_1 = __importDefault(require("./routes/ai.routes"));
var crm_routes_1 = __importDefault(require("./routes/crm.routes"));
var mediakit_routes_1 = __importDefault(require("./routes/mediakit.routes"));
var billing_routes_1 = __importDefault(require("./routes/billing.routes"));
var inbox_routes_1 = __importDefault(require("./routes/inbox.routes"));
var notification_routes_1 = __importDefault(require("./routes/notification.routes"));
var path_1 = __importDefault(require("path"));
var error_middleware_1 = require("./middleware/error.middleware");
var app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/health', health_routes_1.default);
app.use('/api/v1/health', health_routes_1.default);
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/social', social_routes_1.default);
app.use('/api/v1/content', content_routes_1.contentRouter);
app.use('/api/v1/media', media_routes_1.mediaRouter);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/growth', growth_routes_1.default);
app.use('/api/v1/ai', ai_routes_1.default);
app.use('/api/v1/crm', crm_routes_1.default);
app.use('/api/v1/media-kit', mediakit_routes_1.default);
app.use('/api/v1/billing', billing_routes_1.default);
app.use('/api/v1/inbox', inbox_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
var uploadsPath = process.env.VERCEL ? path_1.default.join('/tmp', 'uploads') : path_1.default.join(process.cwd(), 'uploads');
app.use('/uploads', express_1.default.static(uploadsPath));
app.use(error_middleware_1.errorHandler);
exports.default = app;
