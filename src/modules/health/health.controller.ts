import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { IHealthService } from './health.service';
import { TYPES } from '@/shared/types';

@injectable()
export class HealthController {
    constructor(
        @inject(TYPES.HealthService) private healthService: IHealthService
    ) { }

    public getHealth = (_req: Request, res: Response): void => {
        const health = this.healthService.check();
        res.json(health);
    };
}
