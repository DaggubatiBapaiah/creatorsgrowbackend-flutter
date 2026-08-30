"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var mediakit_controller_1 = require("../controllers/mediakit.controller");
var auth_middleware_1 = require("../middleware/auth.middleware");
var router = (0, express_1.Router)();
var controller = new mediakit_controller_1.MediaKitController();
// Public unauthenticated route (rate limited via app defaults)
router.get('/public/kit/:identifier', controller.renderPublicKit);
// Private authenticated routes
router.get('/config', auth_middleware_1.authenticate, controller.getConfig);
router.post('/config', auth_middleware_1.authenticate, controller.saveConfig);
exports.default = router;
