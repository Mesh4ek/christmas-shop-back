import { injectable, inject } from 'inversify';
import { PrismaClient } from '../../generated/prisma/client';
import { TYPES } from '@/shared/types';
import { logger } from '@/common/logger';

type Order = Awaited<ReturnType<typeof PrismaClient.prototype.order.findUnique>>;
type OrderStatus = 'created' | 'paid' | 'cancelled';
type OrderItem = Awaited<ReturnType<typeof PrismaClient.prototype.orderItem.findUnique>>;

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface IOrderService {
    create(userId: string, items: CreateOrderItemDto[]): Promise<Order>;
    findById(id: string): Promise<Order | null>;
    findByUserId(userId: string, page?: number, limit?: number): Promise<PaginatedResult<Order>>;
    findAll(page?: number, limit?: number): Promise<PaginatedResult<Order>>;
    updateStatus(id: string, status: OrderStatus): Promise<Order>;
    cancelOrder(id: string, userId: string): Promise<Order>;
}

export interface CreateOrderItemDto {
    productId: string;
    quantity: number;
}

export type OrderWithItems = Order & {
    orderItems: (OrderItem & {
        product: {
            id: string;
            name: string;
            imageBase64: string | null;
        };
    })[];
}

@injectable()
export class OrderService implements IOrderService {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient
    ) {}

    async create(userId: string, items: CreateOrderItemDto[]): Promise<Order> {
        if (items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        const productIds = items.map(item => item.productId);
        const products = await (this.prisma as any).product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
        });

        if (products.length !== productIds.length) {
            throw new Error('One or more products not found or inactive');
        }

        for (const item of items) {
            const product = products.find((p: any) => p.id === item.productId);
            if (!product) continue;
            
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
        }

        let totalCents = 0;
        const orderItemsData = items.map(item => {
            const product = products.find((p: any) => p.id === item.productId)!;
            const itemTotal = product.priceCents * item.quantity;
            totalCents += itemTotal;

            return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCents: product.priceCents,
            };
        });

        const order = await (this.prisma as any).$transaction(async (tx: any) => {
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
                await (tx as any).product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            logger.info({ orderId: newOrder.id, userId, totalCents }, 'Order created');
            return newOrder;
        });

        return order;
    }

    async findById(id: string): Promise<Order | null> {
        return (this.prisma as any).order.findUnique({
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
        }) as Promise<any>;
    }

    async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Order>> {
        const skip = (page - 1) * limit;
        const where = { userId };
        
        const [data, total] = await Promise.all([
            (this.prisma as any).order.findMany({
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
            (this.prisma as any).order.count({ where }),
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

    async findAll(page: number = 1, limit: number = 15): Promise<PaginatedResult<Order>> {
        const skip = (page - 1) * limit;
        
        const [data, total] = await Promise.all([
            (this.prisma as any).order.findMany({
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
            (this.prisma as any).order.count(),
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

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const order = await (this.prisma as any).order.update({
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

        logger.info({ orderId: id, status }, 'Order status updated');
        return order;
    }

    async cancelOrder(id: string, userId: string): Promise<Order> {
        // Check if order belongs to user or user is admin
        const order = await (this.prisma as any).order.findUnique({
            where: { id },
            include: { orderItems: true },
        });

        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status !== 'created') {
            throw new Error('Only orders with "created" status can be cancelled');
        }

        const cancelledOrder = await (this.prisma as any).$transaction(async (tx: any) => {
            for (const item of order.orderItems) {
                await (tx as any).product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            const updatedOrder = await (tx as any).order.update({
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

            logger.info({ orderId: id, userId }, 'Order cancelled');
            return updatedOrder;
        });

        return cancelledOrder;
    }
}

