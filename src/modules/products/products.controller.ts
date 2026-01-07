import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { IProductService } from './products.service';
import { TYPES } from '@/shared/types';
import { logger } from '@/common/logger';
import { createProductSchema, updateProductSchema } from './products.validation';

@injectable()
export class ProductController {
    constructor(
        @inject(TYPES.ProductService) private productService: IProductService
    ) {}

    public getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const excludeOutOfStock = req.query.excludeOutOfStock === 'true';
            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 12;
            
            const result = await this.productService.findAll(includeInactive, page, limit, excludeOutOfStock);
            
            // Transform products to include name/description based on language
            const transformedProducts = result.data.map((product: any) => ({
                ...product,
                name: lang === 'uk' ? product.nameUk : product.nameEn,
                description: lang === 'uk' ? product.descriptionUk : product.descriptionEn,
            }));
            
            res.json({
                data: transformedProducts,
                pagination: result.pagination,
            });
        } catch (error) {
            logger.error({ error }, 'Failed to get products');
            res.status(500).json({ error: 'Failed to get products' });
        }
    };

    public getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            // Allow viewing inactive products if includeInactive query param is true (for admins)
            const includeInactive = req.query.includeInactive === 'true';
            const lang = (req.query.lang as string) || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            const product = await this.productService.findById(id, includeInactive);
            
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }

            // Transform product to include name/description based on language
            const transformedProduct = {
                ...product,
                name: lang === 'uk' ? (product as any).nameUk : (product as any).nameEn,
                description: lang === 'uk' ? (product as any).descriptionUk : (product as any).descriptionEn,
            };

            res.json(transformedProduct);
        } catch (error) {
            logger.error({ error }, 'Failed to get product');
            res.status(500).json({ error: 'Failed to get product' });
        }
    };

    public create = async (req: Request, res: Response): Promise<void> => {
        try {
            const validationResult = createProductSchema.safeParse(req.body);
            
            if (!validationResult.success) {
                const errors = validationResult.error.issues.map((err: any) => ({
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
        } catch (error) {
            logger.error({ error }, 'Failed to create product');
            res.status(500).json({ error: 'Failed to create product' });
        }
    };

    public update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            
            const validationResult = updateProductSchema.safeParse(req.body);
            
            if (!validationResult.success) {
                const errors = validationResult.error.issues.map((err: any) => ({
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
        } catch (error) {
            logger.error({ error }, 'Failed to update product');
            if ((error as any).code === 'P2025') {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to update product' });
        }
    };

    public delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await this.productService.delete(id);
            res.status(204).send();
        } catch (error) {
            logger.error({ error }, 'Failed to delete product');
            if ((error as any).code === 'P2025' || (error instanceof Error && error.message === 'Product not found')) {
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
}

