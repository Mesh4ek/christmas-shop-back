-- Revert multilingual fields back to simple name and description
-- This migration converts name_en/name_uk to name and description_en/description_uk to description

-- Step 1: Add temporary columns for name and description
ALTER TABLE "products" ADD COLUMN "name_temp" TEXT;
ALTER TABLE "products" ADD COLUMN "description_temp" TEXT;

-- Step 2: Copy data from multilingual fields (prefer name_en, fallback to name_uk)
UPDATE "products" SET "name_temp" = COALESCE("name_en", "name_uk");
UPDATE "products" SET "description_temp" = COALESCE("description_en", "description_uk");

-- Step 3: Drop multilingual columns
ALTER TABLE "products" DROP COLUMN "name_en";
ALTER TABLE "products" DROP COLUMN "name_uk";
ALTER TABLE "products" DROP COLUMN "description_en";
ALTER TABLE "products" DROP COLUMN "description_uk";
ALTER TABLE "products" DROP COLUMN "category";

-- Step 4: Rename temporary columns to final names
ALTER TABLE "products" RENAME COLUMN "name_temp" TO "name";
ALTER TABLE "products" RENAME COLUMN "description_temp" TO "description";

-- Step 5: Make name NOT NULL (it should already have data)
ALTER TABLE "products" ALTER COLUMN "name" SET NOT NULL;

-- Step 6: Drop ProductCategory enum if it exists and is not used elsewhere
DROP TYPE IF EXISTS "ProductCategory";

