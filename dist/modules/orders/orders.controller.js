"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../shared/types");
const logger_1 = require("../../common/logger");
let OrderController = class OrderController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    create = async (req, res) => {
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to create order');
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
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const order = await this.orderService.findById(id);
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            // Users can only view their own orders (unless admin)
            const orderWithUserId = order;
            if (userRole !== 'admin' && orderWithUserId.userId !== userId) {
                res.status(403).json({ error: 'Forbidden: You can only view your own orders' });
                return;
            }
            // Transform product names based on language
            if (orderWithUserId.orderItems) {
                orderWithUserId.orderItems = orderWithUserId.orderItems.map((item) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                }));
            }
            res.json(orderWithUserId);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get order');
            res.status(500).json({ error: 'Failed to get order' });
        }
    };
    getMyOrders = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.orderService.findByUserId(userId, page, limit);
            // Transform product names based on language
            const transformedOrders = result.data.map((order) => ({
                ...order,
                orderItems: order.orderItems?.map((item) => ({
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get orders');
            res.status(500).json({ error: 'Failed to get orders' });
        }
    };
    getAll = async (req, res) => {
        try {
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const result = await this.orderService.findAll(page, limit);
            // Transform product names based on language
            const transformedOrders = result.data.map((order) => ({
                ...order,
                orderItems: order.orderItems?.map((item) => ({
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get all orders');
            res.status(500).json({ error: 'Failed to get all orders' });
        }
    };
    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const validStatuses = ['created', 'paid', 'cancelled'];
            if (!status || !validStatuses.includes(status)) {
                res.status(400).json({
                    error: `Status must be one of: ${validStatuses.join(', ')}`
                });
                return;
            }
            const order = await this.orderService.updateStatus(id, status);
            res.json(order);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to update order status');
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to update order status' });
        }
    };
    pay = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            logger_1.logger.debug({ orderId: id, userId }, 'Processing payment request');
            const order = await this.orderService.findById(id);
            if (!order) {
                logger_1.logger.warn({ orderId: id, userId }, 'Order not found for payment');
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            // Type assertion to access userId
            const orderWithUserId = order;
            logger_1.logger.debug({ orderId: id, orderUserId: orderWithUserId.userId, requestUserId: userId }, 'Order found, checking ownership');
            if (!orderWithUserId.userId || orderWithUserId.userId !== userId) {
                logger_1.logger.warn({ orderId: id, orderUserId: orderWithUserId.userId, requestUserId: userId }, 'Order ownership mismatch');
                res.status(403).json({ error: 'You can only pay for your own orders' });
                return;
            }
            if (orderWithUserId.status !== 'created') {
                res.status(400).json({ error: `Order cannot be paid. Current status: ${orderWithUserId.status}` });
                return;
            }
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const updatedOrder = await this.orderService.updateStatus(id, 'paid');
            const orderWithItems = await this.orderService.findById(id);
            // Transform product names based on language
            if (orderWithItems && orderWithItems.orderItems) {
                orderWithItems.orderItems = orderWithItems.orderItems.map((item) => ({
                    ...item,
                    product: {
                        ...item.product,
                        name: lang === 'uk' ? item.product.nameUk : item.product.nameEn,
                    },
                }));
            }
            logger_1.logger.info({ orderId: id, userId }, 'Order payment successful');
            res.json(orderWithItems);
        }
        catch (error) {
            logger_1.logger.error({ error, orderId: req.params.id, userId: req.user?.id }, 'Failed to pay order');
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Order not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to pay order' });
        }
    };
    cancel = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const order = await this.orderService.cancelOrder(id, userId);
            res.json(order);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to cancel order');
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
};
exports.OrderController = OrderController;
exports.OrderController = OrderController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.OrderService)),
    __metadata("design:paramtypes", [Object])
], OrderController);
