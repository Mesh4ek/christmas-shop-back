import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { container } from '@/shared/container';
import { TYPES } from '@/shared/types';
import { HealthController } from '@/modules/health/health.controller';
import { UserController } from '@/modules/users/users.controller';
import { ProductController } from '@/modules/products/products.controller';
import { OrderController } from '@/modules/orders/orders.controller';
import { StatisticsController } from '@/modules/statistics/statistics.controller';
import { authMiddleware, adminMiddleware } from '@/modules/users/auth.middleware';
import { logger } from '@/common/logger';
import { errorHandler } from '@/common/error-handler';

export class App {
    private app: Express;

    constructor() {
        this.app = express();
        this.setupMiddlewares();
        this.setupRoutes();
    }

    private setupMiddlewares() {
        this.app.use(cors());
        
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5173", "*"],
                },
            },
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }));
        
        this.app.use(express.json({ limit: '20mb' }));

        this.app.use((req, res, next) => {
            const start = Date.now();
            
            logger.debug({
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
                let logLevel: 'info' | 'warn' | 'error';
                if (res.statusCode >= 500) {
                    logLevel = 'error';
                } else if (res.statusCode >= 400) {
                    logLevel = 'error';
                } else if (res.statusCode >= 300 && res.statusCode !== 304) {
                    logLevel = 'warn';
                } else {
                    logLevel = 'info';
                }
                
                logger[logLevel]({
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

    private setupRoutes() {
        const healthController = container.get<HealthController>(TYPES.HealthController);
        const userController = container.get<UserController>(TYPES.UserController);
        const productController = container.get<ProductController>(TYPES.ProductController);
        const orderController = container.get<OrderController>(TYPES.OrderController);
        const statisticsController = container.get<StatisticsController>(TYPES.StatisticsController);

        this.app.get('/health', healthController.getHealth);
        this.app.get('/api/statistics', statisticsController.getStatistics);

        this.app.post('/api/auth/register', userController.register);
        this.app.post('/api/auth/login', userController.login);
        this.app.get('/api/auth/profile', authMiddleware, userController.getProfile);
        this.app.put('/api/auth/profile', authMiddleware, userController.updateProfile);
        this.app.put('/api/auth/password', authMiddleware, userController.updatePassword);

        this.app.get('/api/products', productController.getAll);
        this.app.get('/api/products/:id', productController.getById);
        this.app.post('/api/products', authMiddleware, adminMiddleware, productController.create);
        this.app.put('/api/products/:id', authMiddleware, adminMiddleware, productController.update);
        this.app.delete('/api/products/:id', authMiddleware, adminMiddleware, productController.delete);

        this.app.post('/api/orders', authMiddleware, orderController.create);
        this.app.get('/api/orders/my', authMiddleware, orderController.getMyOrders);
        this.app.post('/api/orders/:id/pay', authMiddleware, orderController.pay);
        this.app.post('/api/orders/:id/cancel', authMiddleware, orderController.cancel);
        this.app.get('/api/orders/:id', authMiddleware, orderController.getById);
        this.app.get('/api/orders', authMiddleware, adminMiddleware, orderController.getAll);
        this.app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, orderController.updateStatus);

        this.app.use(errorHandler);
    }

    public listen(port: number) {
        this.app.listen(port, () => {
            logger.info(`Server running on http://localhost:${port}`);
        });
    }
}
