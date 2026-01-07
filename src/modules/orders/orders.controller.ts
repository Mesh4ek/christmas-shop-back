import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { IOrderService } from './orders.service';
import { TYPES } from '@/shared/types';
import { logger } from '@/common/logger';
type OrderStatus = 'created' | 'paid' | 'cancelled';
import { AuthRequest } from '@/modules/users/auth.middleware';

@injectable()
export class OrderController {
    constructor(
        @inject(TYPES.OrderService) private orderService: IOrderService
    ) {}

    public create = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({ error: 'Order must contain at least one item' });
                return;
            }

            for (const item of items) {
                if (!item.productId || !item.quantity) {
                    res.status(400).json({ error: 'Each item must have productId and quantity' });
                    return;
                }
                if (typeof item.quantity !== 'number' || item.quantity < 1) {
                    res.status(400).json({ error: 'Quantity must be a positive number' });
                    return;
                }
            }

            const order = await this.orderService.create(userId, items);
            
            if (!order || !order.id) {
                res.status(500).json({ error: 'Failed to create order' });
                return;
            }
            
            const orderWithItems = await this.orderService.findById(order.id);
            
            if (!orderWithItems) {
                res.status(500).json({ error: 'Failed to retrieve created order' });
                return;
            }

            res.status(201).json(orderWithItems);
        } catch (error) {
            logger.error({ error }, 'Failed to create order');
            if (error instanceof Error) {
                if (error.message.includes('not found') || error.message.includes('inactive')) {
                    res.status(404).json({ error: error.message });
                    return;
                }
                if (error.message.includes('stock')) {
                    res.status(400).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Failed to create order' });
        }
    };

    public getById = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';

            const order = await this.orderService.findById(id);
            
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            // Users can only view their own orders (unless admin)
            const orderWithUserId = order as any;
            if (userRole !== 'admin' && orderWithUserId.userId !== userId) {
                res.status(403).json({ error: 'Forbidden: You can only view your own orders' });
                return;
            }

            // Transform product names based on language
            if (orderWithUserId.orderItems) {
                orderWithUserId.orderItems = orderWithUserId.orderItems.map((item: any) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                }));
            }

            res.json(orderWithUserId);
        } catch (error) {
            logger.error({ error }, 'Failed to get order');
            res.status(500).json({ error: 'Failed to get order' });
        }
    };

    public getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const result = await this.orderService.findByUserId(userId, page, limit);
            
            // Transform product names based on language
            const transformedOrders = result.data.map((order: any) => ({
                ...order,
                orderItems: order.orderItems?.map((item: any) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                })) || [],
            }));
            
            res.json({
                data: transformedOrders,
                pagination: result.pagination,
            });
        } catch (error) {
            logger.error({ error }, 'Failed to get orders');
            res.status(500).json({ error: 'Failed to get orders' });
        }
    };

    public getAll = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 15;
            
            const result = await this.orderService.findAll(page, limit);
            
            // Transform product names based on language
            const transformedOrders = result.data.map((order: any) => ({
                ...order,
                orderItems: order.orderItems?.map((item: any) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                })) || [],
            }));
            
            res.json({
                data: transformedOrders,
                pagination: result.pagination,
            });
        } catch (error) {
            logger.error({ error }, 'Failed to get all orders');
            res.status(500).json({ error: 'Failed to get all orders' });
        }
    };

    public updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses: OrderStatus[] = ['created', 'paid', 'cancelled'];
            if (!status || !validStatuses.includes(status as OrderStatus)) {
                res.status(400).json({ 
                    error: `Status must be one of: ${validStatuses.join(', ')}` 
                });
                return;
            }

            const order = await this.orderService.updateStatus(id, status);
            res.json(order);
        } catch (error) {
            logger.error({ error }, 'Failed to update order status');
            if ((error as any).code === 'P2025') {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to update order status' });
        }
    };

    public pay = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            logger.debug({ orderId: id, userId }, 'Processing payment request');

            const order = await this.orderService.findById(id);
            
            if (!order) {
                logger.warn({ orderId: id, userId }, 'Order not found for payment');
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            // Type assertion to access userId
            const orderWithUserId = order as any;
            logger.debug({ orderId: id, orderUserId: orderWithUserId.userId, requestUserId: userId }, 'Order found, checking ownership');
            
            if (!orderWithUserId.userId || orderWithUserId.userId !== userId) {
                logger.warn({ orderId: id, orderUserId: orderWithUserId.userId, requestUserId: userId }, 'Order ownership mismatch');
                res.status(403).json({ error: 'You can only pay for your own orders' });
                return;
            }

            if (orderWithUserId.status !== 'created') {
                res.status(400).json({ error: `Order cannot be paid. Current status: ${orderWithUserId.status}` });
                return;
            }

            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const updatedOrder = await this.orderService.updateStatus(id, 'paid');
            const orderWithItems = await this.orderService.findById(id);
            
            // Transform product names based on language
            if (orderWithItems && (orderWithItems as any).orderItems) {
                (orderWithItems as any).orderItems = (orderWithItems as any).orderItems.map((item: any) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                }));
            }
            
            logger.info({ orderId: id, userId }, 'Order payment successful');
            res.json(orderWithItems);
        } catch (error) {
            logger.error({ error, orderId: req.params.id, userId: req.user?.id }, 'Failed to pay order');
            if ((error as any).code === 'P2025') {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to pay order' });
        }
    };

    public cancel = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const order = await this.orderService.cancelOrder(id, userId);
            res.json(order);
        } catch (error) {
            logger.error({ error }, 'Failed to cancel order');
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    res.status(404).json({ error: error.message });
                    return;
                }
                if (error.message.includes('status')) {
                    res.status(400).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Failed to cancel order' });
        }
    };
}

