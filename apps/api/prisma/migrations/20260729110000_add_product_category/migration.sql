CREATE TYPE "ProductCategory" AS ENUM ('JUICE', 'KEFIR', 'JAM_JELLY');

ALTER TABLE "Product"
ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'JUICE';
