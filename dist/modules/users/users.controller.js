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
exports.UserController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../shared/types");
const logger_1 = require("../../common/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_validation_1 = require("./users.validation");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    register = async (req, res) => {
        try {
            const validationResult = users_validation_1.registerSchema.safeParse(req.body);
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
        }
        catch (error) {
            logger_1.logger.error({
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
    login = async (req, res) => {
        try {
            const validationResult = users_validation_1.loginSchema.safeParse(req.body);
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Login failed');
            res.status(500).json({ error: 'Login failed' });
        }
    };
    getProfile = async (req, res) => {
        try {
            // req.user is set by auth middleware
            const userId = req.user?.id;
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Get profile failed');
            res.status(500).json({ error: 'Failed to get profile' });
        }
    };
    updateProfile = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const validationResult = users_validation_1.updateProfileSchema.safeParse(req.body);
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
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Update profile failed');
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update profile' });
        }
    };
    updatePassword = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const validationResult = users_validation_1.updatePasswordSchema.safeParse(req.body);
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
            const { currentPassword, newPassword } = validationResult.data;
            await this.userService.updatePassword(userId, currentPassword, newPassword);
            res.json({ message: 'Password updated successfully' });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Update password failed');
            if (error instanceof Error) {
                const statusCode = error.message.includes('incorrect') || error.message.includes('not found') ? 400 : 500;
                res.status(statusCode).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Failed to update password' });
        }
    };
    generateToken(userId, email, role) {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        return jsonwebtoken_1.default.sign({ userId, email, role }, secret, { expiresIn: '7d' });
    }
};
exports.UserController = UserController;
exports.UserController = UserController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.UserService)),
    __metadata("design:paramtypes", [Object])
], UserController);
