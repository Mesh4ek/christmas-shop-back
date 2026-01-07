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
exports.ProductController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../shared/types");
const logger_1 = require("../../common/logger");
const products_validation_1 = require("./products.validation");
let ProductController = class ProductController {
    productService;
    constructor(productService) {
        this.productService = productService;
    }
    getAll = async (req, res) => {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const excludeOutOfStock = req.query.excludeOutOfStock === 'true';
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const result = await this.productService.findAll(includeInactive, page, limit, excludeOutOfStock);
            // Transform products to include name/description based on language
            const transformedProducts = result.data.map((product) => ({
                ...product,
                name: lang === 'uk' ? product.nameUk : product.nameEn,
                description: lang === 'uk' ? product.descriptionUk : product.descriptionEn,
            }));
            res.json({
                data: transformedProducts,
                pagination: result.pagination,
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get products');
            res.status(500).json({ error: 'Failed to get products' });
        }
    };
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            // Allow viewing inactive products if includeInactive query param is true (for admins)
            const includeInactive = req.query.includeInactive === 'true';
            const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const product = await this.productService.findById(id, includeInactive);
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            // Transform product to include name/description based on language
            const transformedProduct = {
                ...product,
                name: lang === 'uk' ? product.nameUk : product.nameEn,
                description: lang === 'uk' ? product.descriptionUk : product.descriptionEn,
            };
            res.json(transformedProduct);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get product');
            res.status(500).json({ error: 'Failed to get product' });
        }
    };
    create = async (req, res) => {
        try {
            const validationResult = products_validation_1.createProductSchema.safeParse(req.body);
            if (!validationResult.success) {
                const errors = validationResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    error: errors[0]?.message || 'Validation failed',
                    errors: errors,
                });
                return;
            }
            const product = await this.productService.create(validationResult.data);
            res.status(201).json(product);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to create product');
            res.status(500).json({ error: 'Failed to create product' });
        }
    };
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const validationResult = products_validation_1.updateProductSchema.safeParse(req.body);
            if (!validationResult.success) {
                const errors = validationResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    error: errors[0]?.message || 'Validation failed',
                    errors: errors,
                });
                return;
            }
            const product = await this.productService.update(id, validationResult.data);
            res.json(product);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to update product');
            if (error.code === 'P2025') {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to update product' });
        }
    };
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            await this.productService.delete(id);
            res.status(204).send();
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to delete product');
            if (error.code === 'P2025' || (error instanceof Error && error.message === 'Product not found')) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            if (error instanceof Error && error.message.includes('Cannot delete product')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to delete product' });
        }
    };
};
exports.ProductController = ProductController;
exports.ProductController = ProductController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ProductService)),
    __metadata("design:paramtypes", [Object])
], ProductController);
