-- CreateTable
CREATE TABLE "temperatures" (
    "id" TEXT NOT NULL,
    "rack" TEXT NOT NULL,
    "packet" INTEGER NOT NULL,
    "top" DOUBLE PRECISION NOT NULL,
    "middle" DOUBLE PRECISION NOT NULL,
    "bottom" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperatures_pkey" PRIMARY KEY ("id")
);
