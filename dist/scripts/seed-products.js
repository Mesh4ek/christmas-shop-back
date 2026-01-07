"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const image_base64_map_json_1 = __importDefault(require("./image-base64-map.json"));
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
const productDataMap = {
    'handcrafted-luxury-wreath.png': {
        nameEn: 'Handcrafted Luxury Wreath',
        nameUk: 'Розкішний вінок ручної роботи',
        descriptionEn: 'Premium balsam fir with gold accents and hand-tied ribbon. Perfect for welcoming guests.',
        descriptionUk: 'Преміальна ялиця з золотими акцентами та ручно зав\'язаною стрічкою. Ідеально для привітання гостей.',
        priceCents: 8900,
        stock: 25,
    },
    'vintage-glass-ornaments-set.png': {
        nameEn: 'Vintage Glass Ornaments Set',
        nameUk: 'Вінтажний набір скляних прикрас',
        descriptionEn: 'Set of 12 hand-painted glass ornaments featuring classic Christmas motifs.',
        descriptionUk: 'Набір з 12 розписаних вручну скляних прикрас з класичними різдвяними мотивами.',
        priceCents: 4500,
        stock: 50,
    },
    'midnight-pine-candle.png': {
        nameEn: 'Midnight Pine Candle',
        nameUk: 'Свічка "Північна сосна"',
        descriptionEn: 'Natural soy wax candle with pine and cedar essential oils. 40-hour burn time.',
        descriptionUk: 'Свічка з натурального соєвого воску з ефірними оліями сосни та кедра. Час горіння 40 годин.',
        priceCents: 3200,
        stock: 30,
    },
    'classic-red-velvet-stocking.png': {
        nameEn: 'Classic Red Velvet Stocking',
        nameUk: 'Класична червона оксамитова панчоха',
        descriptionEn: 'Hand-embroidered velvet stocking with gold trim. Personalization available.',
        descriptionUk: 'Ручна вишивка оксамитова панчоха з золотою обробкою. Доступна персоналізація.',
        priceCents: 2800,
        stock: 40,
    },
    'crystal-snowflake-garland.png': {
        nameEn: 'Crystal Snowflake Garland',
        nameUk: 'Кришталева гірлянда зі сніжинками',
        descriptionEn: 'Elegant crystal snowflake garland, 6 feet long. Adds sparkle to any room.',
        descriptionUk: 'Елегантна кришталева гірлянда зі сніжинками, довжиною 6 футів. Додає блиск будь-якій кімнаті.',
        priceCents: 5500,
        stock: 20,
    },
    'nordic-wooden-tree-ornaments.png': {
        nameEn: 'Nordic Wooden Tree Ornaments',
        nameUk: 'Північні дерев\'яні прикраси для ялинки',
        descriptionEn: 'Set of 8 hand-carved wooden ornaments in Scandinavian style. Natural wood finish.',
        descriptionUk: 'Набір з 8 вручну вирізьблених дерев\'яних прикрас у скандинавському стилі. Натуральна деревина.',
        priceCents: 3800,
        stock: 35,
    },
    'frosted-glass-votive-set.png': {
        nameEn: 'Frosted Glass Votive Set',
        nameUk: 'Набір матових скляних свічок',
        descriptionEn: 'Set of 6 frosted glass votive holders with LED tea lights included.',
        descriptionUk: 'Набір з 6 матових скляних підсвічників з LED чайними свічками в комплекті.',
        priceCents: 2400,
        stock: 45,
    },
    'plush-reindeer-figurine.png': {
        nameEn: 'Plush Reindeer Figurine',
        nameUk: 'М\'яка фігурка оленя',
        descriptionEn: 'Soft plush reindeer with embroidered details. Perfect for children\'s rooms.',
        descriptionUk: 'М\'який плюшевий олень з вишитими деталями. Ідеально для дитячих кімнат.',
        priceCents: 4200,
        stock: 28,
    },
    'metallic-star-tree-topper.png': {
        nameEn: 'Metallic Star Tree Topper',
        nameUk: 'Металева зірка для ялинки',
        descriptionEn: 'Shimmering gold star tree topper with LED lights. Battery operated.',
        descriptionUk: 'Блискуча золота зірка для ялинки з LED підсвіткою. Працює на батарейках.',
        priceCents: 3500,
        stock: 15,
    },
    'artisan-pottery-advent-calendar.png': {
        nameEn: 'Artisan Pottery Advent Calendar',
        nameUk: 'Ремісничий глиняний адвент-календар',
        descriptionEn: 'Handcrafted ceramic advent calendar with 24 numbered drawers.',
        descriptionUk: 'Вручну виготовлений керамічний адвент-календар з 24 пронумерованими шухлядками.',
        priceCents: 6800,
        stock: 12,
    },
    'felted-wool-christmas-tree.png': {
        nameEn: 'Felted Wool Christmas Tree',
        nameUk: 'Войлочна ялинка',
        descriptionEn: 'Small decorative felted wool Christmas tree. Perfect for tabletops.',
        descriptionUk: 'Невелика декоративна войлочна ялинка. Ідеально для столів.',
        priceCents: 2900,
        stock: 30,
    },
    'copper-wire-angel-ornament.png': {
        nameEn: 'Copper Wire Angel Ornament',
        nameUk: 'Ангел з мідного дроту',
        descriptionEn: 'Delicate copper wire angel ornament with crystal accents.',
        descriptionUk: 'Делікатна прикраса-ангел з мідного дроту з кришталевими акцентами.',
        priceCents: 1800,
        stock: 60,
    },
    'luxury-silk-tree-skirt.png': {
        nameEn: 'Luxury Silk Tree Skirt',
        nameUk: 'Розкішна шовкова спідниця для ялинки',
        descriptionEn: 'Premium silk tree skirt with embroidered border. 60-inch diameter.',
        descriptionUk: 'Преміальна шовкова спідниця для ялинки з вишитим краєм. Діаметр 60 дюймів.',
        priceCents: 7500,
        stock: 18,
    },
    'hand-blown-glass-baubles.png': {
        nameEn: 'Hand-Blown Glass Baubles',
        nameUk: 'Вручну видувані скляні кульки',
        descriptionEn: 'Set of 6 hand-blown glass baubles in assorted colors. Each one unique.',
        descriptionUk: 'Набір з 6 вручну видуваних скляних кульок різних кольорів. Кожна унікальна.',
        priceCents: 5200,
        stock: 25,
    },
    'cinnamon-stick-bundle.png': {
        nameEn: 'Cinnamon Stick Bundle',
        nameUk: 'Пучок паличок кориці',
        descriptionEn: 'Natural cinnamon sticks bundled with twine. Adds festive fragrance.',
        descriptionUk: 'Натуральні палички кориці, зв\'язані мотузкою. Додає святковий аромат.',
        priceCents: 1500,
        stock: 50,
    },
    'vintage-tin-cookie-cutters.png': {
        nameEn: 'Vintage Tin Cookie Cutters',
        nameUk: 'Вінтажні олов\'яні формочки для печива',
        descriptionEn: 'Set of 12 vintage-style tin cookie cutters in classic Christmas shapes.',
        descriptionUk: 'Набір з 12 вінтажних олов\'яних формочок для печива у класичних різдвяних формах.',
        priceCents: 2200,
        stock: 0,
    },
    'embroidered-linen-table-runner.png': {
        nameEn: 'Embroidered Linen Table Runner',
        nameUk: 'Вишита льняна скатертина',
        descriptionEn: 'Elegant linen table runner with hand-embroidered holly pattern.',
        descriptionUk: 'Елегантна льняна скатертина з вручну вишитим візерунком падуба.',
        priceCents: 4800,
        stock: 22,
    },
    'led-fairy-light-string.png': {
        nameEn: 'LED Fairy Light String',
        nameUk: 'LED гірлянда з феєріями',
        descriptionEn: 'Warm white LED fairy lights, 20 feet. Battery operated with timer.',
        descriptionUk: 'Теплі білі LED феєрії, 20 футів. Працює на батарейках з таймером.',
        priceCents: 1900,
        stock: 55,
    },
    'ceramic-mistletoe-hanging.png': {
        nameEn: 'Ceramic Mistletoe Hanging',
        nameUk: 'Керамічне підвісне омела',
        descriptionEn: 'Hand-painted ceramic mistletoe hanging with ribbon. 8 inches.',
        descriptionUk: 'Вручну розписане керамічне підвісне омела зі стрічкою. 8 дюймів.',
        priceCents: 2600,
        stock: 32,
    },
    'wool-felt-stocking-set.png': {
        nameEn: 'Wool Felt Stocking Set',
        nameUk: 'Набір панчіх з вовняного фетру',
        descriptionEn: 'Set of 4 wool felt stockings in assorted colors. Handcrafted details.',
        descriptionUk: 'Набір з 4 панчіх з вовняного фетру різних кольорів. Ручна робота.',
        priceCents: 4400,
        stock: 20,
    },
    'brass-bell-garland.png': {
        nameEn: 'Brass Bell Garland',
        nameUk: 'Латунна гірлянда з дзвіночками',
        descriptionEn: 'Antique-style brass bell garland, 4 feet long. Creates festive sounds.',
        descriptionUk: 'Латунна гірлянда з дзвіночками у вінтажному стилі, довжиною 4 фути. Створює святкові звуки.',
        priceCents: 3600,
        stock: 28,
    },
    'hand-painted-nutcracker.png': {
        nameEn: 'Hand-Painted Nutcracker',
        nameUk: 'Вручну розписаний лускунчик',
        descriptionEn: 'Traditional hand-painted wooden nutcracker, 12 inches tall.',
        descriptionUk: 'Традиційний вручну розписаний дерев\'яний лускунчик, висотою 12 дюймів.',
        priceCents: 6200,
        stock: 15,
    },
    'mercury-glass-vase-set.png': {
        nameEn: 'Mercury Glass Vase Set',
        nameUk: 'Набір ваз з ртутного скла',
        descriptionEn: 'Set of 3 mercury glass vases in varying sizes. Perfect for centerpieces.',
        descriptionUk: 'Набір з 3 ваз з ртутного скла різних розмірів. Ідеально для центральних композицій.',
        priceCents: 5800,
        stock: 18,
    },
    'faux-fur-tree-collar.png': {
        nameEn: 'Faux Fur Tree Collar',
        nameUk: 'Штучне хутро для ялинки',
        descriptionEn: 'Luxurious faux fur tree collar. Replaces traditional tree skirt.',
        descriptionUk: 'Розкішний комір з штучного хутра для ялинки. Замінює традиційну спідницю для ялинки.',
        priceCents: 5400,
        stock: 16,
    },
    'handwoven-baskets-set.png': {
        nameEn: 'Handwoven Baskets Set',
        nameUk: 'Набір плетених кошиків',
        descriptionEn: 'Set of 3 handwoven baskets in natural materials. Great for gift wrapping.',
        descriptionUk: 'Набір з 3 плетених кошиків з натуральних матеріалів. Чудово для упаковки подарунків.',
        priceCents: 4100,
        stock: 24,
    },
};
async function main() {
    console.log('Starting product seed...');
    try {
        const base64Map = image_base64_map_json_1.default;
        const imageFiles = Object.keys(base64Map).sort();
        console.log(`Found ${imageFiles.length} base64 images in JSON file`);
        if (imageFiles.length === 0) {
            console.error('No base64 images found in image-base64-map.json');
            process.exit(1);
        }
        console.log('\nClearing existing data...');
        const deletedOrderItems = await prisma.orderItem.deleteMany({});
        console.log(`Deleted ${deletedOrderItems.count} order items`);
        const deletedOrders = await prisma.order.deleteMany({});
        console.log(`Deleted ${deletedOrders.count} orders`);
        const deletedProducts = await prisma.product.deleteMany({});
        console.log(`Deleted ${deletedProducts.count} products`);
        console.log('\nCreating products from base64 images...');
        let createdCount = 0;
        let skippedCount = 0;
        for (const imageFile of imageFiles) {
            const productData = productDataMap[imageFile];
            if (!productData) {
                console.log(`Skipping ${imageFile} - no product data found`);
                skippedCount++;
                continue;
            }
            const imageBase64 = base64Map[imageFile];
            if (!imageBase64) {
                console.log(`Skipping ${imageFile} - no base64 data found in JSON`);
                skippedCount++;
                continue;
            }
            const created = await prisma.product.create({
                data: {
                    nameEn: productData.nameEn,
                    nameUk: productData.nameUk,
                    descriptionEn: productData.descriptionEn,
                    descriptionUk: productData.descriptionUk,
                    priceCents: productData.priceCents,
                    imageBase64: imageBase64,
                    stock: productData.stock,
                    isActive: true,
                },
            });
            console.log(`Created: ${created.nameEn} ($${(created.priceCents / 100).toFixed(2)}) - ${imageFile}`);
            createdCount++;
        }
        const totalCount = await prisma.product.count();
        console.log(`\nSuccessfully seeded ${createdCount} products!`);
        if (skippedCount > 0) {
            console.log(`Skipped ${skippedCount} image files (no product data)`);
        }
        console.log(`Total products in database: ${totalCount}`);
        console.log('\nCreating admin user...');
        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin123';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
        try {
            const existingAdmin = await prisma.user.findUnique({
                where: { email: adminEmail },
            });
            if (existingAdmin) {
                console.log(`Admin user already exists: ${adminEmail}`);
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: {
                        name: 'aa',
                        surname: 'aa',
                        phone: '11111111111',
                        passwordHash: passwordHash,
                        role: 'admin',
                    },
                });
                console.log(`Updated admin user: ${adminEmail}`);
            }
            else {
                const adminUser = await prisma.user.create({
                    data: {
                        email: adminEmail,
                        passwordHash: passwordHash,
                        name: 'aa',
                        surname: 'aa',
                        phone: '11111111111',
                        role: 'admin',
                    },
                });
                console.log(`Created admin user: ${adminEmail} (ID: ${adminUser.id})`);
            }
            console.log(`Admin credentials:`);
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        }
        catch (error) {
            console.error(`Failed to create/update admin user:`, error);
            throw error;
        }
    }
    catch (error) {
        console.error('Error seeding products:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
