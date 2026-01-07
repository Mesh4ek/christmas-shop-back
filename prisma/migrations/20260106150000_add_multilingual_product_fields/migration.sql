-- Add multilingual fields for products
-- This migration adds name_en, name_uk, description_en, description_uk columns
-- and migrates existing data from name/description to both languages

-- Step 1: Add new multilingual columns
ALTER TABLE "products" ADD COLUMN "name_en" TEXT;
ALTER TABLE "products" ADD COLUMN "name_uk" TEXT;
ALTER TABLE "products" ADD COLUMN "description_en" TEXT;
ALTER TABLE "products" ADD COLUMN "description_uk" TEXT;

-- Step 2: Copy existing data to both languages (using current name/description for both)
UPDATE "products" SET "name_en" = "name", "name_uk" = "name";
UPDATE "products" SET "description_en" = "description", "description_uk" = "description";

-- Step 3: Make name_en and name_uk NOT NULL (they now have data)
ALTER TABLE "products" ALTER COLUMN "name_en" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "name_uk" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "products" DROP COLUMN "name";
ALTER TABLE "products" DROP COLUMN "description";

