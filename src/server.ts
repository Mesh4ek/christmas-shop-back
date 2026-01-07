import 'reflect-metadata';
import { App } from './app';
import { config } from './config';
import { logger } from './common/logger';

async function bootstrap() {
    try {
        const server = new App();
        server.listen(config.PORT);
    } catch (err) {
        logger.error({ err }, 'Fatal error during bootstrap:');
        process.exit(1);
    }
}

bootstrap();
