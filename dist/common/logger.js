"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const isDevelopment = process.env.NODE_ENV === 'development';
exports.logger = (0, pino_1.default)({
    level: isDevelopment ? 'debug' : 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
            singleLine: false,
            errorLikeObjectKeys: ['err', 'error'],
        },
    },
    ...(isDevelopment && {
        serializers: {
            req: pino_1.default.stdSerializers.req,
            res: pino_1.default.stdSerializers.res,
            err: pino_1.default.stdSerializers.err,
        },
    }),
});
