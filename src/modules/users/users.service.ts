import { injectable, inject } from 'inversify';
import { PrismaClient } from '../../generated/prisma/client';
import { TYPES } from '@/shared/types';
import bcrypt from 'bcrypt';
import { logger } from '@/common/logger';

type User = Awaited<ReturnType<typeof PrismaClient.prototype.user.findUnique>>;
type UserRole = 'customer' | 'admin';

export interface IUserService {
    register(email: string, password: string, name?: string, surname?: string, phone?: string): Promise<User>;
    login(email: string, password: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    updateLastLogin(id: string): Promise<void>;
    updateProfile(id: string, data: { name?: string; surname?: string; phone?: string }): Promise<User>;
    updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void>;
}

export interface RegisterDto {
    email: string;
    password: string;
    name?: string;
    surname?: string;
    phone?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient
    ) {}

    async register(
        email: string,
        password: string,
        name?: string,
        surname?: string,
        phone?: string
    ): Promise<User> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await (this.prisma as any).user.create({
            data: {
                email,
                passwordHash,
                name,
                surname,
                phone,
                role: 'customer',
            },
        });

        logger.info({ userId: user.id, email }, 'User registered successfully');
        return user;
    }

    async login(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmail(email);
        if (!user) {
            return null;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return null;
        }

        await this.updateLastLogin(user.id);

        logger.info({ userId: user.id, email }, 'User logged in successfully');
        return user;
    }

    async findById(id: string): Promise<User | null> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        
        return (this.prisma as any).user.findUnique({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        
        return (this.prisma as any).user.findUnique({
            where: { email },
        });
    }

    async updateLastLogin(id: string): Promise<void> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        
        await (this.prisma as any).user.update({
            where: { id },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }

    async updateProfile(id: string, data: { name?: string; surname?: string; phone?: string }): Promise<User> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.surname !== undefined) updateData.surname = data.surname;
        if (data.phone !== undefined) updateData.phone = data.phone;

        const user = await (this.prisma as any).user.update({
            where: { id },
            data: updateData,
        });

        logger.info({ userId: id }, 'User profile updated');
        return user;
    }

    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }

        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }

        // Get user and verify current password
        const user = await this.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        await (this.prisma as any).user.update({
            where: { id },
            data: { passwordHash },
        });

        logger.info({ userId: id }, 'User password updated');
    }
}

