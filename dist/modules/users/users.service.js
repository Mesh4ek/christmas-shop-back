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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const inversify_1 = require("inversify");
const client_1 = require("../../generated/prisma/client");
const types_1 = require("../../shared/types");
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("../../common/logger");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(email, password, name, surname, phone) {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                surname,
                phone,
                role: 'customer',
            },
        });
        logger_1.logger.info({ userId: user.id, email }, 'User registered successfully');
        return user;
    }
    async login(email, password) {
        const user = await this.findByEmail(email);
        if (!user) {
            return null;
        }
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return null;
        }
        await this.updateLastLogin(user.id);
        logger_1.logger.info({ userId: user.id, email }, 'User logged in successfully');
        return user;
    }
    async findById(id) {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async updateLastLogin(id) {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        await this.prisma.user.update({
            where: { id },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }
    async updateProfile(id, data) {
        if (!this.prisma) {
            throw new Error('Prisma client is not initialized');
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.surname !== undefined)
            updateData.surname = data.surname;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        logger_1.logger.info({ userId: id }, 'User profile updated');
        return user;
    }
    async updatePassword(id, currentPassword, newPassword) {
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
        const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        // Hash new password
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(newPassword, saltRounds);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
        logger_1.logger.info({ userId: id }, 'User password updated');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], UserService);
