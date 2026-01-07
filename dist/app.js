"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const container_1 = require("./shared/container");
const types_1 = require("./shared/types");
const auth_middleware_1 = require("./modules/users/auth.middleware");
const logger_1 = require("./common/logger");
const error_handler_1 = require("./common/error-handler");
class App {
    app;
    constructor() {
        this.app = (0, express_1.default)();
        this.setupMiddlewares();
        this.setupRoutes();
    }
    setupMiddlewares() {
        this.app.use((0, cors_1.default)());
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5173", "*"],
                },
            },
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }));
        this.app.use(express_1.default.json({ limit: '20mb' }));
        this.app.use((req, res, next) => {
            const start = Date.now();
            logger_1.logger.debug({
                method: req.method,
                url: req.url,
                path: req.path,
                query: req.query,
                headers: {
                    'content-type': req.headers['content-type'],
                    'authorization': req.headers.authorization ? 'Bearer ***' : undefined,
                    'user-agent': req.headers['user-agent'],
                },
                ip: req.ip || req.socket.remoteAddress,
            }, 'Incoming request');
            res.on('finish', () => {
                const duration = Date.now() - start;
                let logLevel;
                if (res.statusCode >= 500) {
                    logLevel = 'error';
                }
                else if (res.statusCode >= 400) {
                    logLevel = 'error';
                }
                else if (res.statusCode >= 300 && res.statusCode !== 304) {
                    logLevel = 'warn';
                }
                else {
                    logLevel = 'info';
                }
                logger_1.logger[logLevel]({
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    contentLength: res.get('content-length'),
                }, `${req.method} ${req.url} - ${res.statusCode}`);
            });
            next();
        });
    }
    setupRoutes() {
        const healthController = container_1.container.get(types_1.TYPES.HealthController);
        const userController = container_1.container.get(types_1.TYPES.UserController);
        const productController = container_1.container.get(types_1.TYPES.ProductController);
        const orderController = container_1.container.get(types_1.TYPES.OrderController);
        const statisticsController = container_1.container.get(types_1.TYPES.StatisticsController);
        this.app.get('/health', healthController.getHealth);
        this.app.get('/api/statistics', statisticsController.getStatistics);
        this.app.post('/api/auth/register', userController.register);
        this.app.post('/api/auth/login', userController.login);
        this.app.get('/api/auth/profile', auth_middleware_1.authMiddleware, userController.getProfile);
        this.app.put('/api/auth/profile', auth_middleware_1.authMiddleware, userController.updateProfile);
        this.app.put('/api/auth/password', auth_middleware_1.authMiddleware, userController.updatePassword);
        this.app.get('/api/products', productController.getAll);
        this.app.get('/api/products/:id', productController.getById);
        this.app.post('/api/products', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, productController.create);
        this.app.put('/api/products/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, productController.update);
        this.app.delete('/api/products/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, productController.delete);
        this.app.post('/api/orders', auth_middleware_1.authMiddleware, orderController.create);
        this.app.get('/api/orders/my', auth_middleware_1.authMiddleware, orderController.getMyOrders);
        this.app.post('/api/orders/:id/pay', auth_middleware_1.authMiddleware, orderController.pay);
        this.app.post('/api/orders/:id/cancel', auth_middleware_1.authMiddleware, orderController.cancel);
        this.app.get('/api/orders/:id', auth_middleware_1.authMiddleware, orderController.getById);
        this.app.get('/api/orders', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, orderController.getAll);
        this.app.put('/api/orders/:id/status', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, orderController.updateStatus);
        this.app.use(error_handler_1.errorHandler);
    }
    listen(port) {
        this.app.listen(port, () => {
            logger_1.logger.info(`Server running on http://localhost:${port}`);
        });
    }
}
exports.App = App;
