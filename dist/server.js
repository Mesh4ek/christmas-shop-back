"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = require("./app");
const config_1 = require("./config");
const logger_1 = require("./common/logger");
async function bootstrap() {
    try {
        const server = new app_1.App();
        server.listen(config_1.config.PORT);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Fatal error during bootstrap:');
        process.exit(1);
    }
}
bootstrap();
