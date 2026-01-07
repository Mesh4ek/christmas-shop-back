import 'reflect-metadata';
import 'dotenv/config';
import { Container } from 'inversify';
import { TYPES } from './types';
import { HealthService, IHealthService } from '@/modules/health/health.service';
import { HealthController } from '@/modules/health/health.controller';
import { UserService, IUserService } from '@/modules/users/users.service';
import { UserController } from '@/modules/users/users.controller';
import { ProductService, IProductService } from '@/modules/products/products.service';
import { ProductController } from '@/modules/products/products.controller';
import { OrderService, IOrderService } from '@/modules/orders/orders.service';
import { OrderController } from '@/modules/orders/orders.controller';
import { StatisticsService, IStatisticsService } from '@/modules/statistics/statistics.service';
import { StatisticsController } from '@/modules/statistics/statistics.controller';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../src/generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<IHealthService>(TYPES.HealthService).to(HealthService).inSingletonScope();
container.bind<HealthController>(TYPES.HealthController).to(HealthController).inSingletonScope();
container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();
container.bind<IProductService>(TYPES.ProductService).to(ProductService).inSingletonScope();
container.bind<ProductController>(TYPES.ProductController).to(ProductController).inSingletonScope();
container.bind<IOrderService>(TYPES.OrderService).to(OrderService).inSingletonScope();
container.bind<OrderController>(TYPES.OrderController).to(OrderController).inSingletonScope();
container.bind<IStatisticsService>(TYPES.StatisticsService).to(StatisticsService).inSingletonScope();
container.bind<StatisticsController>(TYPES.StatisticsController).to(StatisticsController).inSingletonScope();

export { container };