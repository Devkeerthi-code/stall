-- Orders are saved as a preview first; sentAt marks the moment the customer sends them on WhatsApp.
ALTER TABLE "Order" ADD COLUMN "sentAt" TIMESTAMP(3);

DROP INDEX "Order_shopId_createdAt_idx";
CREATE INDEX "Order_shopId_sentAt_idx" ON "Order"("shopId", "sentAt" DESC);
