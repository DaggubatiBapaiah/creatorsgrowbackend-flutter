"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var errors_1 = require("../utils/errors");
var env_1 = require("../config/env");
var errorHandler = function (err, req, res, next) {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
    }
    // Treat as 500 Internal Error
    console.error('Unhandled internal server error:', err);
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected internal server error occurred.',
            details: env_1.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    });
};
exports.errorHandler = errorHandler;
