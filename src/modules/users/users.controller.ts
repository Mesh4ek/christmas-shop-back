import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { IUserService } from './users.service';
import { TYPES } from '@/shared/types';
import { logger } from '@/common/logger';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from './users.validation';

@injectable()
export class UserController {
    constructor(
        @inject(TYPES.UserService) private userService: IUserService
    ) {}

    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const validationResult = registerSchema.safeParse(req.body);
            
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

            const { email, password, name, surname, phone } = validationResult.data;

            const user = await this.userService.register(email, password, name, surname, phone);
            
            if (!user) {
                res.status(500).json({ error: 'Failed to create user' });
                return;
            }

            const token = this.generateToken(user.id, user.email, user.role);

            res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name ?? undefined,
                    surname: user.surname ?? undefined,
                    role: user.role,
                },
                token,
            });
        } catch (error) {
            logger.error({ 
                error, 
                err: error instanceof Error ? error : undefined,
                stack: error instanceof Error ? error.stack : undefined,
                requestBody: { 
                    email: req.body.email, 
                    hasPassword: !!req.body.password,
                    hasName: !!req.body.name,
                },
            }, 'Registration failed');
            if (error instanceof Error && error.message === 'User with this email already exists') {
                res.status(409).json({ error: error.message });
                return;
            }
            const errorMessage = error instanceof Error ? error.message : 'Registration failed';
            res.status(500).json({ error: errorMessage });
        }
    };

    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const validationResult = loginSchema.safeParse(req.body);
            
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

            const { email, password } = validationResult.data;

            const user = await this.userService.login(email, password);
            if (!user) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            const token = this.generateToken(user.id, user.email, user.role);

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    surname: user.surname,
                    role: user.role,
                },
                token,
            });
        } catch (error) {
            logger.error({ error }, 'Login failed');
            res.status(500).json({ error: 'Login failed' });
        }
    };

    public getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            // req.user is set by auth middleware
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const user = await this.userService.findById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            });
        } catch (error) {
            logger.error({ error }, 'Get profile failed');
            res.status(500).json({ error: 'Failed to get profile' });
        }
    };

    public updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const validationResult = updateProfileSchema.safeParse(req.body);
            
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

            const { name, surname, phone } = validationResult.data;

            const user = await this.userService.updateProfile(userId, { name, surname, phone });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                phone: user.phone,
                role: user.role,
            });
        } catch (error) {
            logger.error({ error }, 'Update profile failed');
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update profile' });
        }
    };

    public updatePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const validationResult = updatePasswordSchema.safeParse(req.body);
            
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

            const { currentPassword, newPassword } = validationResult.data;

            await this.userService.updatePassword(userId, currentPassword, newPassword);

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            logger.error({ error }, 'Update password failed');
            if (error instanceof Error) {
                const statusCode = error.message.includes('incorrect') || error.message.includes('not found') ? 400 : 500;
                res.status(statusCode).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update password' });
        }
    };

    private generateToken(userId: string, email: string, role: string): string {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        return jwt.sign(
            { userId, email, role },
            secret,
            { expiresIn: '7d' }
        );
    }
}

