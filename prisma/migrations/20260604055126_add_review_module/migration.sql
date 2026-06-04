-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "bookingId" TEXT,
ADD COLUMN     "dealerId" TEXT,
ADD COLUMN     "targetType" TEXT NOT NULL DEFAULT 'car',
ALTER COLUMN "carId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_dealerId_idx" ON "Review"("dealerId");

-- CreateIndex
CREATE INDEX "Review_targetType_idx" ON "Review"("targetType");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
