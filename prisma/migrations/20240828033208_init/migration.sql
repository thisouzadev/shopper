-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "measureDatetime" TIMESTAMP(3) NOT NULL,
    "measureType" TEXT NOT NULL,
    "measureValue" INTEGER,
    "imageUrl" TEXT NOT NULL,
    "hasConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measure_pkey" PRIMARY KEY ("id")
);
