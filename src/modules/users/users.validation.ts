import { z } from 'zod';

export const registerSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .max(254, 'Email is too long (max 254 characters)')
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .refine(
            (email) => {
                // Check for consecutive dots
                if (email.includes('..')) return false;
                // Check domain has at least one dot
                const parts = email.split('@');
                if (parts.length !== 2 || !parts[1].includes('.')) return false;
                // Check domain part is valid
                const domain = parts[1];
                if (domain.length < 4) return false;
                const domainParts = domain.split('.');
                // Check that no domain part is empty
                if (domainParts.some(part => part.length === 0)) return false;
                // Check that TLD (top-level domain, last part) is at least 2 characters
                const tld = domainParts[domainParts.length - 1];
                if (tld.length < 2) return false;
                return true;
            },
            { message: 'Invalid email format' }
        ),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Za-z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters long')
        .max(30, 'Name must be less than 30 characters')
        .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
        .transform(val => val.trim()),
    surname: z
        .string()
        .min(1, 'Surname is required')
        .min(2, 'Surname must be at least 2 characters long')
        .max(30, 'Surname must be less than 30 characters')
        .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/, 'Surname can only contain letters, spaces, hyphens, and apostrophes')
        .transform(val => val.trim()),
    phone: z
        .string()
        .min(1, 'Phone is required')
        .max(20, 'Phone must be less than 20 characters')
        .transform(val => val.trim())
        .refine(
            (phone) => {
                // Phone is now required, so it cannot be empty
                if (!phone) return false;

                // Check minimum length (at least 7 digits)
                const digitsOnly = phone.replace(/\D/g, '');
                if (digitsOnly.length < 7) {
                    return false;
                }

                // Check for valid phone characters
                if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
                    return false;
                }

                // Check that phone starts with a digit or + (for international format)
                if (!/^[\d\+]/.test(phone)) {
                    return false;
                }

                // Check that it doesn't end with a special character
                if (/[\s\-\+\(\)]$/.test(phone)) {
                    return false;
                }

                // Check for balanced parentheses
                const openParens = (phone.match(/\(/g) || []).length;
                const closeParens = (phone.match(/\)/g) || []).length;
                if (openParens !== closeParens) {
                    return false;
                }

                // Check that plus sign is only at the beginning
                if (phone.includes('+') && !phone.startsWith('+')) {
                    return false;
                }

                return true;
            },
            { message: 'Invalid phone number format' }
        ),
});

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .max(254, 'Email is too long (max 254 characters)')
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .refine(
            (email) => {
                // Check for consecutive dots
                if (email.includes('..')) return false;
                // Check domain has at least one dot
                const parts = email.split('@');
                if (parts.length !== 2 || !parts[1].includes('.')) return false;
                // Check domain part is valid
                const domain = parts[1];
                if (domain.length < 4) return false;
                const domainParts = domain.split('.');
                // Check that no domain part is empty
                if (domainParts.some(part => part.length === 0)) return false;
                // Check that TLD (top-level domain, last part) is at least 2 characters
                const tld = domainParts[domainParts.length - 1];
                if (tld.length < 2) return false;
                return true;
            },
            { message: 'Invalid email format' }
        ),
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters long')
        .max(30, 'Name must be less than 30 characters')
        .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
        .transform(val => val.trim()),
    surname: z
        .string()
        .min(1, 'Surname is required')
        .min(2, 'Surname must be at least 2 characters long')
        .max(30, 'Surname must be less than 30 characters')
        .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ\s'-]+$/, 'Surname can only contain letters, spaces, hyphens, and apostrophes')
        .transform(val => val.trim()),
    phone: z
        .string()
        .min(1, 'Phone is required')
        .max(20, 'Phone must be less than 20 characters')
        .transform(val => val.trim())
        .refine(
            (phone) => {
                // Phone is required, so it cannot be empty
                if (!phone) return false;

                // Check minimum length (at least 7 digits)
                const digitsOnly = phone.replace(/\D/g, '');
                if (digitsOnly.length < 7) {
                    return false;
                }

                // Check for valid phone characters
                if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
                    return false;
                }

                // Check that phone starts with a digit or + (for international format)
                if (!/^[\d\+]/.test(phone)) {
                    return false;
                }

                // Check that it doesn't end with a special character
                if (/[\s\-\+\(\)]$/.test(phone)) {
                    return false;
                }

                // Check for balanced parentheses
                const openParens = (phone.match(/\(/g) || []).length;
                const closeParens = (phone.match(/\)/g) || []).length;
                if (openParens !== closeParens) {
                    return false;
                }

                // Check that plus sign is only at the beginning
                if (phone.includes('+') && !phone.startsWith('+')) {
                    return false;
                }

                return true;
            },
            { message: 'Invalid phone number format' }
        ),
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(6, 'Password must be at least 6 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/[A-Za-z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

