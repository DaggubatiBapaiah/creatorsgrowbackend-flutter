"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaRouter = void 0;
var express_1 = require("express");
var multer_1 = __importDefault(require("multer"));
var auth_middleware_1 = require("../middleware/auth.middleware");
var media_controller_1 = require("../controllers/media.controller");
exports.mediaRouter = (0, express_1.Router)();
var mediaController = new media_controller_1.MediaController();
var upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
exports.mediaRouter.use(auth_middleware_1.authenticate);
exports.mediaRouter.post('/upload', upload.single('file'), mediaController.upload);
