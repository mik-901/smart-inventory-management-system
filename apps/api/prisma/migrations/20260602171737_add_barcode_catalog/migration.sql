-- CreateTable
CREATE TABLE "barcode_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "description" TEXT,
    "image_url" TEXT,
    "cost_price" REAL,
    "selling_price" REAL,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'piece',
    "source" TEXT NOT NULL DEFAULT 'local',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "barcode_catalog_barcode_key" ON "barcode_catalog"("barcode");

-- CreateIndex
CREATE INDEX "barcode_catalog_barcode_idx" ON "barcode_catalog"("barcode");
