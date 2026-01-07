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
exports.OrderService = void 0;
const inversify_1 = require("inversify");
const client_1 = require("../../generated/prisma/client");
const types_1 = require("../../shared/types");
const logger_1 = require("../../common/logger");
let OrderService = class OrderService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, items) {
        if (items.length === 0) {
            throw new Error('Order must contain at least one item');
        }
        const productIds = items.map(item => item.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
        });
        if (products.length !== productIds.length) {
            throw new Error('One or more products not found or inactive');
        }
        for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product)
                continue;
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
        }
        let totalCents = 0;
        const orderItemsData = items.map(item => {
            const product = products.find((p) => p.id === item.productId);
            const itemTotal = product.priceCents * item.quantity;
            totalCents += itemTotal;
            return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: product.priceCents,
            };
        });
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    status: 'created',
                    totalCents,
                    orderItems: {
                        create: orderItemsData,
                    },
                },
            });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            logger_1.logger.info({ orderId: newOrder.id, userId, totalCents }, 'Order created');
            return newOrder;
        });
        return order;
    }
    async findById(id) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameUk: true,
                                imageBase64: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async findByUserId(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = { userId };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    nameEn: true,
                                    nameUk: true,
                                    imageBase64: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findAll(page = 1, limit = 15) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    nameEn: true,
                                    nameUk: true,
                                    imageBase64: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            surname: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count(),
        ]);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateStatus(id, status) {
        const order = await this.prisma.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameUk: true,
                                imageBase64: true,
                            },
                        },
                    },
                },
            },
        });
        logger_1.logger.info({ orderId: id, status }, 'Order status updated');
        return order;
    }
    async cancelOrder(id, userId) {
        // Check if order belongs to user or user is admin
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { orderItems: true },
        });
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status !== 'created') {
            throw new Error('Only orders with "created" status can be cancelled');
        }
        const cancelledOrder = await this.prisma.$transaction(async (tx) => {
            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }
            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status: 'cancelled' },
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    nameEn: true,
                                    nameUk: true,
                                    imageBase64: true,
                                },
                            },
                        },
                    },
                },
            });
            logger_1.logger.info({ orderId: id, userId }, 'Order cancelled');
            return updatedOrder;
        });
        return cancelledOrder;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], OrderService);
