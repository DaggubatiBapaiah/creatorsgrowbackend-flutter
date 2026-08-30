"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var env_1 = require("../config/env");
var errors_1 = require("../utils/errors");
var authenticate = function (req, res, next) {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errors_1.UnauthorizedError('Missing or malformed Authorization header'));
    }
    var token = authHeader.split(' ')[1];
    try {
        var payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = {
            id: payload.sub,
            email: payload.email,
        };
        next();
    }
    catch (error) {
        next(new errors_1.UnauthorizedError('Invalid or expired authentication token'));
    }
};
exports.authenticate = authenticate;
