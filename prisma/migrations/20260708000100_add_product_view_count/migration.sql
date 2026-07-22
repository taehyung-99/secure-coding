ALTER TABLE "Product" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Product_viewCount_idx" ON "Product"("viewCount");
