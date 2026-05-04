-- CreateTable
CREATE TABLE "FleetOwner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "facebookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FleetOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FleetOwner_email_key" ON "FleetOwner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FleetOwner_googleId_key" ON "FleetOwner"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "FleetOwner_facebookId_key" ON "FleetOwner"("facebookId");
