import { injectable } from 'inversify';

export interface IHealthService {
    check(): { status: string; uptime: number; timestamp: string };
}

@injectable()
export class HealthService implements IHealthService {
    check() {
        return {
            status: 'OK',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}
