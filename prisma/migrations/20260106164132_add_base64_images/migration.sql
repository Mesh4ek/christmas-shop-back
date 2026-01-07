-- AlterTable
ALTER TABLE "products" ADD COLUMN "image_base64" TEXT;

-- DropTable (remove old image_url column)
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_url";

