import { z } from 'zod';

export const createProductSchema = z.object({
    nameEn: z
        .string()
        .min(1, 'Name (English) is required')
        .min(2, 'Name (English) must be at least 2 characters long')
        .max(100, 'Name (English) must be less than 100 characters')
        .transform(val => val.trim()),
    nameUk: z
        .string()
        .min(1, 'Name (Ukrainian) is required')
        .min(2, 'Name (Ukrainian) must be at least 2 characters long')
        .max(100, 'Name (Ukrainian) must be less than 100 characters')
        .transform(val => val.trim()),
    descriptionEn: z
        .string()
        .max(2000, 'Description (English) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    descriptionUk: z
        .string()
        .max(2000, 'Description (Ukrainian) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    priceCents: z
        .number()
        .int('Price must be an integer (in cents)')
        .positive('Price must be greater than 0')
        .max(99999999, 'Price is too large (max 999,999.99)'),
    imageBase64: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true; // Optional field
                // Check if it's a valid base64 string or data URL
                if (val.startsWith('data:image/')) {
                    const base64Part = val.split(',')[1];
                    if (!base64Part) return false;
                    return /^[A-Za-z0-9+/=]+$/.test(base64Part);
                }
                return /^[A-Za-z0-9+/=]+$/.test(val);
            },
            { message: 'Invalid base64 image format' }
        )
        .transform(val => val?.trim() || undefined),
    stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .max(999999, 'Stock is too large')
        .default(0),
    isActive: z
        .boolean()
        .default(true),
});

export const updateProductSchema = z.object({
    nameEn: z
        .string()
        .min(1, 'Name (English) is required')
        .min(2, 'Name (English) must be at least 2 characters long')
        .max(100, 'Name (English) must be less than 100 characters')
        .transform(val => val.trim())
        .optional(),
    nameUk: z
        .string()
        .min(1, 'Name (Ukrainian) is required')
        .min(2, 'Name (Ukrainian) must be at least 2 characters long')
        .max(100, 'Name (Ukrainian) must be less than 100 characters')
        .transform(val => val.trim())
        .optional(),
    descriptionEn: z
        .string()
        .max(2000, 'Description (English) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    descriptionUk: z
        .string()
        .max(2000, 'Description (Ukrainian) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    priceCents: z
        .number()
        .int('Price must be an integer (in cents)')
        .positive('Price must be greater than 0')
        .max(99999999, 'Price is too large (max 999,999.99)')
        .optional(),
    imageBase64: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true; // Optional field
                // Check if it's a valid base64 string or data URL
                if (val.startsWith('data:image/')) {
                    const base64Part = val.split(',')[1];
                    if (!base64Part) return false;
                    return /^[A-Za-z0-9+/=]+$/.test(base64Part);
                }
                return /^[A-Za-z0-9+/=]+$/.test(val);
            },
            { message: 'Invalid base64 image format' }
        )
        .transform(val => val?.trim() || undefined),
    stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .max(999999, 'Stock is too large')
        .optional(),
    isActive: z
        .boolean()
        .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

