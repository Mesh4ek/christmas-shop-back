import { injectable, inject } from 'inversify';
import { TYPES } from '@/shared/types';
import { PrismaClient } from '../../generated/prisma/client';
import { logger } from '@/common/logger';

export interface IStatisticsService {
    getStatistics(): Promise<{
        totalOrders: number;
        totalProducts: number;
        totalUsers: number;
        totalRevenue: number;
    }>;
}

@injectable()
export class StatisticsService implements IStatisticsService {
    constructor(
        @inject(TYPES.PrismaClient) private prisma: PrismaClient
    ) {}

    async getStatistics(): Promise<{
        totalOrders: number;
        totalProducts: number;
        totalUsers: number;
        totalRevenue: number;
    }> {
        try {
            const [totalOrders, totalProducts, totalUsers, paidOrders] = await Promise.all([
                (this.prisma as any).order.count(),
                (this.prisma as any).product.count({ where: { isActive: true } }),
                (this.prisma as any).user.count(),
                (this.prisma as any).order.findMany({
                    where: { status: 'paid' },
                    select: { totalCents: true },
                }),
            ]);

            const totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + order.totalCents, 0);

            return {
                totalOrders,
                totalProducts,
                totalUsers,
                totalRevenue,
            };
        } catch (error) {
            logger.error({ error }, 'Failed to get statistics');
            throw error;
        }
    }
}

