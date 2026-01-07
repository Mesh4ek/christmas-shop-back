import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Extended error logging
    logger.error({
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
