"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    nameEn: zod_1.z
        .string()
        .min(1, 'Name (English) is required')
        .min(2, 'Name (English) must be at least 2 characters long')
        .max(100, 'Name (English) must be less than 100 characters')
        .transform(val => val.trim()),
    nameUk: zod_1.z
        .string()
        .min(1, 'Name (Ukrainian) is required')
        .min(2, 'Name (Ukrainian) must be at least 2 characters long')
        .max(100, 'Name (Ukrainian) must be less than 100 characters')
        .transform(val => val.trim()),
    descriptionEn: zod_1.z
        .string()
        .max(2000, 'Description (English) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    descriptionUk: zod_1.z
        .string()
        .max(2000, 'Description (Ukrainian) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    priceCents: zod_1.z
        .number()
        .int('Price must be an integer (in cents)')
        .positive('Price must be greater than 0')
        .max(99999999, 'Price is too large (max 999,999.99)'),
    imageBase64: zod_1.z
        .string()
        .optional()
        .refine((val) => {
        if (!val || val.trim() === '')
            return true; // Optional field
        // Check if it's a valid base64 string or data URL
        if (val.startsWith('data:image/')) {
            const base64Part = val.split(',')[1];
            if (!base64Part)
                return false;
            return /^[A-Za-z0-9+/=]+$/.test(base64Part);
        }
        return /^[A-Za-z0-9+/=]+$/.test(val);
    }, { message: 'Invalid base64 image format' })
        .transform(val => val?.trim() || undefined),
    stock: zod_1.z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .max(999999, 'Stock is too large')
        .default(0),
    isActive: zod_1.z
        .boolean()
        .default(true),
});
exports.updateProductSchema = zod_1.z.object({
    nameEn: zod_1.z
        .string()
        .min(1, 'Name (English) is required')
        .min(2, 'Name (English) must be at least 2 characters long')
        .max(100, 'Name (English) must be less than 100 characters')
        .transform(val => val.trim())
        .optional(),
    nameUk: zod_1.z
        .string()
        .min(1, 'Name (Ukrainian) is required')
        .min(2, 'Name (Ukrainian) must be at least 2 characters long')
        .max(100, 'Name (Ukrainian) must be less than 100 characters')
        .transform(val => val.trim())
        .optional(),
    descriptionEn: zod_1.z
        .string()
        .max(2000, 'Description (English) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    descriptionUk: zod_1.z
        .string()
        .max(2000, 'Description (Ukrainian) must be less than 2000 characters')
        .optional()
        .transform(val => val?.trim() || undefined),
    priceCents: zod_1.z
        .number()
        .int('Price must be an integer (in cents)')
        .positive('Price must be greater than 0')
        .max(99999999, 'Price is too large (max 999,999.99)')
        .optional(),
    imageBase64: zod_1.z
        .string()
        .optional()
        .refine((val) => {
        if (!val || val.trim() === '')
            return true; // Optional field
        // Check if it's a valid base64 string or data URL
        if (val.startsWith('data:image/')) {
            const base64Part = val.split(',')[1];
            if (!base64Part)
                return false;
            return /^[A-Za-z0-9+/=]+$/.test(base64Part);
        }
        return /^[A-Za-z0-9+/=]+$/.test(val);
    }, { message: 'Invalid base64 image format' })
        .transform(val => val?.trim() || undefined),
    stock: zod_1.z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .max(999999, 'Stock is too large')
        .optional(),
    isActive: zod_1.z
        .boolean()
        .optional(),
});
