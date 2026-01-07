import { injectable, inject } from 'inversify';
import { PrismaClient } from '../../generated/prisma/client';
import { TYPES } from '@/shared/types';
import { logger } from '@/common/logger';

type Product = Awaited<ReturnType<typeof PrismaClient.prototype.product.findUnique>>;

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface IProductService {
    findAll(includeInactive?: boolean, page?: number, limit?: number, excludeOutOfStock?: boolean): Promise<PaginatedResult<Product>>;
    findById(id: string, includeInactive?: boolean): Promise<Product | null>;
    create(data: CreateProductDto): Promise<Product>;
    update(id: string, data: UpdateProductDto): Promise<Product>;
    delete(id: string): Promise<void>;
    updateStock(id: string, quantity: number): Promise<Product>;
}

export interface CreateProductDto {
    nameEn: string;
    nameUk: string;
    descriptionEn?: string;
    descriptionUk?: string;
    priceCents: number;
    imageBase64?: string;
    stock?: number;
    isActive?: boolean;
}

export interface UpdateProductDto {
    nameEn?: string;
    nameUk?: string;
    descriptionEn?: string;
    descriptionUk?: string;
    priceCents?: number;
    imageBase64?: string;
    stock?: number;
    isActive?: boolean;
}

@injectable()
export class ProductService implements IProductService {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient
    ) {}

    async findAll(includeInactive: boolean = false, page: number = 1, limit: number = 12, excludeOutOfStock: boolean = false): Promise<PaginatedResult<Product>> {
        const skip = (page - 1) * limit;
        
        const where: any = {};
        if (!includeInactive) {
            where.isActive = true;
        }
        if (excludeOutOfStock) {
            where.stock = { gt: 0 };
        }
        
        const [data, total] = await Promise.all([
            (this.prisma as any).product.findMany({
                where: Object.keys(where).length > 0 ? where : undefined,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            (this.prisma as any).product.count({ where: Object.keys(where).length > 0 ? where : undefined }),
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

    async findById(id: string, includeInactive: boolean = false): Promise<Product | null> {
        const product = await (this.prisma as any).product.findUnique({
            where: { id },
        });
        
        // If product not found, return null
        if (!product) {
            return null;
        }
        
        // If includeInactive is false and product is inactive, return null
        if (!includeInactive && !product.isActive) {
            return null;
        }
        
        return product;
    }

    async create(data: CreateProductDto): Promise<Product> {
        const product = await (this.prisma as any).product.create({
            data: {
                nameEn: data.nameEn,
                nameUk: data.nameUk,
                descriptionEn: data.descriptionEn,
                descriptionUk: data.descriptionUk,
                priceCents: data.priceCents,
                imageBase64: data.imageBase64,
                stock: data.stock ?? 0,
                isActive: data.isActive ?? true,
            },
        });

        logger.info({ productId: product.id, nameEn: product.nameEn }, 'Product created');
        return product;
    }

    async update(id: string, data: UpdateProductDto): Promise<Product> {
        const product = await (this.prisma as any).product.update({
            where: { id },
            data: {
                ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
                ...(data.nameUk !== undefined && { nameUk: data.nameUk }),
                ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
                ...(data.descriptionUk !== undefined && { descriptionUk: data.descriptionUk }),
                ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
                ...(data.imageBase64 !== undefined && { imageBase64: data.imageBase64 }),
                ...(data.stock !== undefined && { stock: data.stock }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        logger.info({ productId: product.id }, 'Product updated');
        return product;
    }

    async delete(id: string): Promise<void> {
        // Check if product exists
        const product = await (this.prisma as any).product.findUnique({
            where: { id },
            include: {
                orderItems: {
                    take: 1, // Just check if any exist
                },
            },
        });

        if (!product) {
            throw new Error('Product not found');
        }

        // Check if product has order items
        const orderItemsCount = await (this.prisma as any).orderItem.count({
            where: { productId: id },
        });

        if (orderItemsCount > 0) {
            throw new Error(`Cannot delete product: it has ${orderItemsCount} order item(s). Products with order history cannot be deleted.`);
        }

        // Safe to delete - no order items exist
        await (this.prisma as any).product.delete({
            where: { id },
        });

        logger.info({ productId: id }, 'Product deleted');
    }

    async updateStock(id: string, quantity: number): Promise<Product> {
        const product = await (this.prisma as any).product.update({
            where: { id },
            data: {
                stock: {
                    increment: quantity,
                },
            },
        });

        logger.info({ productId: id, newStock: product.stock }, 'Product stock updated');
        return product;
    }
}

