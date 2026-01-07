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
exports.ProductService = void 0;
const inversify_1 = require("inversify");
const client_1 = require("../../generated/prisma/client");
const types_1 = require("../../shared/types");
const logger_1 = require("../../common/logger");
let ProductService = class ProductService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(includeInactive = false, page = 1, limit = 12, excludeOutOfStock = false) {
        const skip = (page - 1) * limit;
        const where = {};
        if (!includeInactive) {
            where.isActive = true;
        }
        if (excludeOutOfStock) {
            where.stock = { gt: 0 };
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where: Object.keys(where).length > 0 ? where : undefined,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where: Object.keys(where).length > 0 ? where : undefined }),
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
    async findById(id, includeInactive = false) {
        const product = await this.prisma.product.findUnique({
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
    async create(data) {
        const product = await this.prisma.product.create({
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
        logger_1.logger.info({ productId: product.id, nameEn: product.nameEn }, 'Product created');
        return product;
    }
    async update(id, data) {
        const product = await this.prisma.product.update({
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
        logger_1.logger.info({ productId: product.id }, 'Product updated');
        return product;
    }
    async delete(id) {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
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
        const orderItemsCount = await this.prisma.orderItem.count({
            where: { productId: id },
        });
        if (orderItemsCount > 0) {
            throw new Error(`Cannot delete product: it has ${orderItemsCount} order item(s). Products with order history cannot be deleted.`);
        }
        // Safe to delete - no order items exist
        await this.prisma.product.delete({
            where: { id },
        });
        logger_1.logger.info({ productId: id }, 'Product deleted');
    }
    async updateStock(id, quantity) {
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                stock: {
                    increment: quantity,
                },
            },
        });
        logger_1.logger.info({ productId: id, newStock: product.stock }, 'Product stock updated');
        return product;
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], ProductService);
