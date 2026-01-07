"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("./logger");
const errorHandler = (err, req, res, _next) => {
    // Extended error logging
    logger_1.logger.error({
        err,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
        },
        request: {
            method: req.method,
            url: req.url,
            path: req.path,
            query: req.query,
            body: req.body,
            headers: {
                'content-type': req.headers['content-type'],
                'authorization': req.headers.authorization ? 'Bearer ***' : undefined,
            },
        },
    }, 'Request error');
    res.status(500).json({
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack,
            name: err.name,
        }),
    });
};
exports.errorHandler = errorHandler;
