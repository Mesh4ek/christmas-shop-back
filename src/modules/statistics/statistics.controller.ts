import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '@/shared/types';
import { IStatisticsService } from './statistics.service';
import { logger } from '@/common/logger';

@injectable()
export class StatisticsController {
    constructor(
        @inject(TYPES.StatisticsService) private statisticsService: IStatisticsService
    ) {}

    public getStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.statisticsService.getStatistics();
            res.json(stats);
        } catch (error) {
            logger.error({ error }, 'Failed to get statistics');
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    };
}

