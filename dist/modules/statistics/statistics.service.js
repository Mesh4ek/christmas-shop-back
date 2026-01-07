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
exports.StatisticsService = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../../shared/types");
const client_1 = require("../../generated/prisma/client");
const logger_1 = require("../../common/logger");
let StatisticsService = class StatisticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatistics() {
        try {
            const [totalOrders, totalProducts, totalUsers, paidOrders] = await Promise.all([
                this.prisma.order.count(),
                this.prisma.product.count({ where: { isActive: true } }),
                this.prisma.user.count(),
                this.prisma.order.findMany({
                    where: { status: 'paid' },
                    select: { totalCents: true },
                }),
            ]);
            const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalCents, 0);
            return {
                totalOrders,
                totalProducts,
                totalUsers,
                totalRevenue,
            };
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get statistics');
            throw error;
        }
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PrismaClient)),
    __metadata("design:paramtypes", [client_1.PrismaClient])
], StatisticsService);
