"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var social_controller_1 = require("../controllers/social.controller");
var auth_middleware_1 = require("../middleware/auth.middleware");
var router = (0, express_1.Router)();
var socialController = new social_controller_1.SocialController();
router.get('/accounts', auth_middleware_1.authenticate, socialController.getAccounts);
router.delete('/accounts/:id', auth_middleware_1.authenticate, socialController.disconnectAccount);
// Changed to POST and requires authentication
router.post('/:platform/connect', auth_middleware_1.authenticate, socialController.connect);
// Callback remains GET as it's hit by the browser redirect
// Callback moved to auth.routes.ts
exports.default = router;
