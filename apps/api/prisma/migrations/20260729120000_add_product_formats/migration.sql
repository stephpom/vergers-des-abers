CREATE TYPE "ProductFormat" AS ENUM ('CL_33', 'CL_75', 'L_1');

ALTER TABLE "Product"
ADD COLUMN "formats" "ProductFormat"[] NOT NULL DEFAULT ARRAY[]::"ProductFormat"[];
